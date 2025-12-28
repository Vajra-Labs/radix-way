import assert from 'node:assert';
import {
  prettyPrint,
  escapeRegExp,
  trimRegExpStartAndEnd,
  getClosingBracePosition,
} from './utils';
import {METHOD_NAME_ALL} from './types';
import {NODE_TYPES, StaticNode} from './node';
import type {Result, Router, HTTPMethod} from './types';
import type {WildcardNode, ParametricNode} from './node';

const OPTIONAL_PARAM_REGEXP = /(\/:[^/{}]*?)\?(\/?)/;

// Regex cache for performance optimization
const REGEX_CACHE: Record<string, RegExp> = Object.create(null);
const getCachedRegex = (pattern: string): RegExp => {
  if (!REGEX_CACHE[pattern]) {
    REGEX_CACHE[pattern] = new RegExp('^' + pattern + '$');
  }
  return REGEX_CACHE[pattern];
};

export class RadixTree<T> implements Router<T> {
  #tree: StaticNode<T> = new StaticNode<T>('/');

  add(method: HTTPMethod, path: string, handler: T): void {
    const optional = path.match(OPTIONAL_PARAM_REGEXP);
    if (optional) {
      assert(
        path.length === optional.index + optional[0].length,
        'Optional parameter must be last in path',
      );
      const fullPath = path.replace(OPTIONAL_PARAM_REGEXP, '$1$2');
      const optionalPath = path.replace(OPTIONAL_PARAM_REGEXP, '$2') || '/';
      this.add(method, fullPath, handler);
      this.add(method, optionalPath, handler);
      return;
    }
    // Insert value in tree
    let pattern = path;
    let currentNode: StaticNode<T> | ParametricNode<T> | WildcardNode<T> =
      this.#tree;
    let parentNodePathIndex = (currentNode as StaticNode<T>).prefix.length;
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
        currentNode = (currentNode as StaticNode<T>).createStaticChild(
          staticNodePath,
        );
      }
      if (isParametricNode) {
        let isRegexNode = false;
        let isParamSafe = true;
        let backtrack = '';
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
              currentNode = (
                currentNode as StaticNode<T>
              ).createParametricChild(regex, staticPart || null, nodePath);
              parentNodePathIndex = i + 1;
              break;
            }
          }
        }
      } else if (isWildcardNode) {
        params.push('*');
        currentNode = (currentNode as StaticNode<T>).createWildcardChild();
        parentNodePathIndex = i + 1;
        if (i !== pattern.length - 1) {
          throw new Error('Wildcard must be the last character in the route');
        }
      }
    }
    const paramMap = Object.create(null);
    params.forEach((p, idx) => (paramMap[p] = idx));
    currentNode.addHandler(method, handler, paramMap);
  }

  match(method: HTTPMethod, path: string): Result<T> {
    let curNode: any = this.#tree;
    const originPath = path;
    let pathIndex = curNode.prefix.length;

    const params: string[] = [];
    const pathLen = path.length;
    const brothersNodesStack: any[] = [];

    while (true) {
      if (pathIndex === pathLen && curNode.isLeafNode) {
        const record =
          curNode.handlers[method] || curNode.handlers[METHOD_NAME_ALL];
        if (record) return [record[0], record[1], params];
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

  printTree(print: true): void;
  printTree(print?: false): string;
  printTree(print: boolean = true): void | string {
    const str = prettyPrint(this.#tree);
    if (print) {
      console.log(str);
      return;
    }
    return str;
  }
}
