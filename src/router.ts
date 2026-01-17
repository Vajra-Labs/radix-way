import {
  Null,
  prettyPrint,
  trimRegExpStartAndEnd,
  getClosingBracePosition,
} from './utils';
import {METHOD_NAME_ALL} from './types';
import {NODE_TYPES, StaticNode} from './node';
import type {Result, Router, HTTPMethod} from './types';

/** Matches regex special characters for escaping */
const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
/** Detects dynamic routes containing `:` or `*` */
const DYNAMIC_ROUTE_REGEX = /[:*]/;
/** Matches optional parameters (must be last segment) */
const OPTIONAL_PARAM_REGEXP = /(\/:[^/{}]*?)\?(\/?)/;

// Helper functions
export const isStaticPath = (path: string) => !DYNAMIC_ROUTE_REGEX.test(path);
export const escapeRegExp = (str: string) => str.replace(ESCAPE_REGEX, '\\$&');

const REGEX_CACHE = new Null();
const getCachedRegex = (pattern: string): RegExp => {
  if (!REGEX_CACHE[pattern])
    REGEX_CACHE[pattern] = new RegExp('^' + pattern + '$');
  return REGEX_CACHE[pattern];
};

export class RadixTree<T> implements Router<T> {
  #trees: StaticNode<T> = new StaticNode<T>('/');
  #static = new Map<string, Record<string, Result<T>>>();

  insert(method: HTTPMethod, path: string, handler: T): void {
    if (path[0] !== '/' && path[0] !== '*') {
      throw new SyntaxError(
        'The first character of a path should be `/` or `*`',
      );
    }
    // STATIC ROUTES (O(1))
    if (isStaticPath(path)) {
      if (!this.#static.has(path)) {
        this.#static.set(path, {[method]: [handler]});
      } else {
        const handlers = this.#static.get(path)!;
        if (!handlers[method]) {
          handlers[method] = [handler];
        } else {
          handlers[method].push(handler as any);
        }
      }
      return;
    }
    // OPTIONAL PARAMS
    const optional = path.match(OPTIONAL_PARAM_REGEXP);
    if (optional) {
      if (path.length !== optional.index! + optional[0].length) {
        throw new SyntaxError('Optional parameter must be last in path');
      }
      const fullPath = path.replace(OPTIONAL_PARAM_REGEXP, '$1$2');
      const optionalPath = path.replace(OPTIONAL_PARAM_REGEXP, '$2') || '/';
      this.insert(method, fullPath, handler);
      this.insert(method, optionalPath, handler);
      return;
    }
    // RADIX TREE INSERT
    let pattern = path;
    let curNode: any = this.#trees;
    let parentNodePathIndex = curNode.prefix.length;
    const params: string[] = [];
    for (let i = 0; i <= pattern.length; i++) {
      const isParametricNode = pattern.charCodeAt(i) === 58; // :
      const isWildcardNode = pattern.charCodeAt(i) === 42; // *
      if (
        isParametricNode ||
        isWildcardNode ||
        (i === pattern.length && i !== parentNodePathIndex)
      ) {
        const staticNodePath = pattern.slice(parentNodePathIndex, i);
        curNode = curNode.createStaticChild(staticNodePath);
      }
      if (isParametricNode) {
        let backtrack = '';
        let isRegexNode = false;
        let isParamSafe = true;
        const regexps: string[] = [];
        let lastParamStartIndex = i + 1;

        for (let j = lastParamStartIndex; ; j++) {
          const charCode = pattern.charCodeAt(j);
          const isRegexParam = charCode === 123; // {
          const isStaticPart = charCode === 45 || charCode === 46; // - or .
          const isEndOfNode = charCode === 47 || j === pattern.length; // / or end

          if (isRegexParam || isStaticPart || isEndOfNode) {
            const paramName = pattern.slice(lastParamStartIndex, j);
            params.push(paramName);
            isRegexNode = isRegexNode || isRegexParam || isStaticPart;

            if (isRegexParam) {
              const endOfRegexIndex = getClosingBracePosition(pattern, j);
              const regexString = pattern.slice(j + 1, endOfRegexIndex);
              regexps.push('(' + trimRegExpStartAndEnd(regexString) + ')');
              j = endOfRegexIndex + 1;
              isParamSafe = true;
            } else {
              regexps.push(
                isParamSafe ? '(.*?)' : `(${backtrack}|(?:(?!${backtrack}).)*)`,
              );
              isParamSafe = false;
            }
            const staticPartStartIndex = j;

            for (; j < pattern.length; j++) {
              const charCode = pattern.charCodeAt(j);
              if (charCode === 47) break; // /
              if (charCode === 58) break; // :
            }
            const staticPart = pattern.slice(staticPartStartIndex, j);

            if (staticPart) {
              regexps.push((backtrack = escapeRegExp(staticPart)));
            }
            lastParamStartIndex = j + 1;
            if (
              isEndOfNode ||
              pattern.charCodeAt(j) === 47 ||
              j === pattern.length
            ) {
              const nodePattern = isRegexNode ? '()' + staticPart : staticPart;
              const nodePath = pattern.slice(i, j);
              pattern =
                pattern.slice(0, i + 1) + nodePattern + pattern.slice(j);
              i += nodePattern.length;
              const regex = isRegexNode
                ? getCachedRegex(regexps.join(''))
                : null;
              curNode = curNode.createParametricChild(
                regex,
                staticPart || null,
                nodePath,
              );
              parentNodePathIndex = i + 1;
              break;
            }
          }
        }
      } else if (isWildcardNode) {
        if (i !== pattern.length - 1)
          throw new SyntaxError(
            'Wildcard "*" must be the last character in the route',
          );
        params.push('*');
        curNode = curNode.createWildcardChild();
        parentNodePathIndex = i + 1;
      }
    }
    const map = new Null();
    params.forEach((p, idx) => (map[p] = idx));
    curNode.addHandler(method, handler, map);
  }

  match(method: HTTPMethod, path: string): Result<T> {
    // STATIC FAST PATH
    const staticRecord = this.#static.get(path);
    if (staticRecord)
      return staticRecord[method] || staticRecord[METHOD_NAME_ALL] || null;

    // TREE MATCH
    let curNode: any = this.#trees,
      pathIndex = curNode.prefix.length;
    const params: string[] = [];
    const originPath = path;
    const pathLen = path.length;
    const brothersNodesStack: any[] = [];
    while (true) {
      if (pathIndex === pathLen && curNode.isLeafNode) {
        // If we're at a parametric node but at root path, don't match
        if (
          curNode.kind === NODE_TYPES.PARAMETRIC &&
          pathIndex === NODE_TYPES.PARAMETRIC
        ) {
          return null;
        }
        const record =
          curNode.handlers[method] || curNode.handlers[METHOD_NAME_ALL];
        if (!record) return null;
        record[2] = params;
        return record;
      }
      let node = curNode.getNextNode(
        path,
        pathIndex,
        brothersNodesStack,
        params.length,
      );

      if (node === null) {
        if (brothersNodesStack.length === 0) return null;
        const brotherNodeState = brothersNodesStack.pop();
        pathIndex = brotherNodeState.brotherPathIndex;
        params.splice(brotherNodeState.paramsCount);
        node = brotherNodeState.brotherNode;
      }

      curNode = node;
      if (curNode.kind === NODE_TYPES.STATIC) {
        pathIndex += curNode.prefix.length;
        continue;
      }

      if (curNode.kind === NODE_TYPES.WILDCARD) {
        const param = originPath.slice(pathIndex);
        params.push(param);
        pathIndex = pathLen;
        continue;
      }

      let paramEndIndex = originPath.indexOf('/', pathIndex);
      if (paramEndIndex === -1) paramEndIndex = pathLen;
      const param = originPath.slice(pathIndex, paramEndIndex);

      if (curNode.isRegex) {
        const matchedParameters = curNode.regex.exec(param);
        if (matchedParameters === null) continue;
        for (let i = 1; i < matchedParameters.length; i++) {
          const matchedParam = matchedParameters[i];
          params.push(matchedParam);
        }
      } else {
        params.push(param);
      }
      pathIndex = paramEndIndex;
    }
  }

  printTree(): void {
    let output = '';

    // Print static routes from Map
    if (this.#static.size > 0) {
      output += '┌─ Static Routes (Map)\n';
      for (const [path, methods] of this.#static.entries()) {
        const methodList = Object.keys(methods);
        output += `│  ${path} [${methodList.join(', ')}]\n`;
      }
      output += '│\n';
    }

    // Print dynamic routes from Tree
    output += '└─ Dynamic Routes (Tree)\n';
    const treeStr = prettyPrint(this.#trees);
    // Indent tree output
    output += treeStr
      .split('\n')
      .map(line => (line ? '   ' + line : ''))
      .join('\n');

    console.log(output);
  }
}
