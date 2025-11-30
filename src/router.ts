import assert from 'node:assert';
import {prettyPrint} from './pretty';
import {Result, Router} from './types';
import {NODE_TYPES, StaticNode, WildcardNode, ParametricNode} from './node';

const ESCAPE_REGEXP = /[.*+?^${}()|[\]\\]/g;
const OPTIONAL_PARAM_REGEXP = /(\/:[^/()]*?)\?(\/?)/;

const escapeRegExp = (str: string) => str.replace(ESCAPE_REGEXP, '\\$&');

const trimRegExpStartAndEnd = (regexString: string) => {
  if (regexString.charCodeAt(1) === 94) {
    // ^
    regexString = regexString.slice(0, 1) + regexString.slice(2);
  }
  if (regexString.charCodeAt(regexString.length - 2) === 36) {
    // $
    regexString = regexString.slice(0, -2) + regexString.slice(-1);
  }
  return regexString;
};

const getClosingParenthesesPosition = (path: string, index: number): number => {
  let stack = 1;
  while (index < path.length) {
    index++;
    if (path[index] === '\\') {
      index++;
      continue;
    }
    if (path[index] === ')') stack--;
    if (path[index] === '(') stack++;
    if (stack === 0) return index;
  }
  throw new TypeError(`Invalid regex in "${path}"`);
};

export class RadixTree<T> implements Router<T> {
  #tree: StaticNode<T> = new StaticNode('/');

  add(method: string, path: string, handler: T): void {
    assert(typeof path === 'string', 'Path should be a string');
    assert(path.length > 0, 'Path cannot be empty');
    assert(
      path[0] === '/' || path[0] === '*',
      'Path must start with "/" or "*"',
    );
    const optional = path.match(OPTIONAL_PARAM_REGEXP);
    if (optional) {
      assert(
        path.length === optional.index! + optional[0].length,
        'Optional parameter must be last in path',
      );
      const fullPath = path.replace(OPTIONAL_PARAM_REGEXP, '$1$2');
      const optionalPath = path.replace(OPTIONAL_PARAM_REGEXP, '$2') || '/';
      this.add(method, fullPath, handler);
      this.add(method, optionalPath, handler);
      return;
    }
    void this.#insert(method, path, handler);
  }

  #insert(method: string, path: string, handler: T): void {
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
          const isRegexParam = charCode === 40; // (
          const isStaticPart = charCode === 45 || charCode === 46; // - or .
          const isEndOfNode = charCode === 47 || j === pattern.length; // / or end
          if (isRegexParam || isStaticPart || isEndOfNode) {
            const paramName = pattern.slice(lastParamStartIndex, j);
            params.push(paramName);
            isRegexNode = isRegexNode || isRegexParam || isStaticPart;
            if (isRegexParam) {
              const endOfRegexIndex = getClosingParenthesesPosition(pattern, j);
              const regexString = pattern.slice(j, endOfRegexIndex + 1);
              regexps.push(trimRegExpStartAndEnd(regexString));
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
            let staticPart = pattern.slice(staticPartStartIndex, j);
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
                ? new RegExp('^' + regexps.join('') + '$')
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
      }
    }
    const paramMap: Record<string, number> = Object.create(null);
    params.forEach((p, idx) => (paramMap[p] = idx));
    currentNode.addHandler(method, handler, paramMap);
  }

  match(method: string, path: string): Result<T> {
    let currentNode: any = this.#tree;
    const originPath = path;
    let pathIndex = currentNode.prefix.length;
    const params: string[] = [];
    const pathLen = path.length;
    const brothersNodesStack: any[] = [];
    while (true) {
      if (pathIndex === pathLen && currentNode.isLeafNode) {
        const handlers = currentNode.handlers.get(method);
        if (handlers) return [handlers, params];
      }
      let node = currentNode.getNextNode(
        path,
        pathIndex,
        brothersNodesStack,
        params.length,
      );
      if (node === null) {
        if (brothersNodesStack.length === 0) return [[], []];
        const brotherNodeState = brothersNodesStack.pop();
        pathIndex = brotherNodeState.brotherPathIndex;
        params.splice(brotherNodeState.paramsCount);
        node = brotherNodeState.brotherNode;
      }
      currentNode = node;
      if (currentNode.kind === NODE_TYPES.STATIC) {
        pathIndex += currentNode.prefix.length;
        continue;
      }
      if (currentNode.kind === NODE_TYPES.WILDCARD) {
        let param = originPath.slice(pathIndex);
        params.push(param);
        pathIndex = pathLen;
        continue;
      }
      let paramEndIndex = originPath.indexOf('/', pathIndex);
      if (paramEndIndex === -1) paramEndIndex = pathLen;
      let param = originPath.slice(pathIndex, paramEndIndex);
      if (currentNode.isRegex) {
        const matchedParameters = currentNode.regex.exec(param);
        if (matchedParameters === null) continue;
        for (let i = 1; i < matchedParameters.length; i++) {
          params.push(matchedParameters[i]);
        }
      } else {
        params.push(param);
      }
      pathIndex = paramEndIndex;
    }
  }

  prettyPrint = (): string => prettyPrint(this.#tree);
}
