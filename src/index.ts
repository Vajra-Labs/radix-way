import {Node} from './node';
import {
  prettyPrint,
  escapeRegExp,
  trimRegExpStartAndEnd,
  getClosingParenthesesPosition,
} from './utils';
import {NodeType} from './types';
import type {Result, ParamIndexMap, ParamStash} from './types';

const OPTIONAL_PARAM_REGEXP = /(\/:[^/()]*?)\?(\/?)/;

type BrotherNode<T> = {
  paramsCount: number;
  brotherNode: Node<T>;
  brotherPathIndex: number;
};

export class RadixTree<T> {
  #trees: Map<string, Node<T>> = new Map();

  add(method: string, path: string, handler: T): void {
    const optMatch = path.match(OPTIONAL_PARAM_REGEXP);
    if (optMatch) {
      const full = path.replace(OPTIONAL_PARAM_REGEXP, '$1$2');
      const optional = path.replace(OPTIONAL_PARAM_REGEXP, '$2') || '/';
      this.add(method, full, handler);
      this.add(method, optional, handler);
      return;
    }

    if (!this.#trees.has(method)) {
      this.#trees.set(method, new Node(NodeType.STATIC, '/'));
    }

    let currentNode = this.#trees.get(method)!;
    let parentNodePathIndex = currentNode.prefix.length;
    const params: string[] = [];

    for (let i = 0; i <= path.length; i++) {
      if (path.charCodeAt(i) === 58 && path.charCodeAt(i + 1) === 58) {
        i++;
        continue;
      }

      const isParametricNode =
        path.charCodeAt(i) === 58 && path.charCodeAt(i + 1) !== 58;
      const isWildcardNode = path.charCodeAt(i) === 42;

      if (
        isParametricNode ||
        isWildcardNode ||
        (i === path.length && i !== parentNodePathIndex)
      ) {
        let staticNodePath = path
          .slice(parentNodePathIndex, i)
          .replaceAll('::', ':');
        currentNode = currentNode.createStaticChild(staticNodePath);
      }

      if (isParametricNode) {
        let isRegexNode = false;
        let isParamSafe = true;
        let backtrack = '';
        const regexps: string[] = [];

        let lastParamStartIndex = i + 1;
        for (let j = lastParamStartIndex; ; j++) {
          const charCode = path.charCodeAt(j);
          const isRegexParam = charCode === 40;
          const isStaticPart = charCode === 45 || charCode === 46;
          const isEndOfNode = charCode === 47 || j === path.length;

          if (isRegexParam || isStaticPart || isEndOfNode) {
            const paramName = path.slice(lastParamStartIndex, j);
            params.push(paramName);

            isRegexNode = isRegexNode || isRegexParam || isStaticPart;

            if (isRegexParam) {
              const endOfRegexIndex = getClosingParenthesesPosition(path, j);
              const regexString = path.slice(j, endOfRegexIndex + 1);
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
            for (; j < path.length; j++) {
              const charCode = path.charCodeAt(j);
              if (charCode === 47) break;
              if (charCode === 58) {
                const nextCharCode = path.charCodeAt(j + 1);
                if (nextCharCode === 58) j++;
                else break;
              }
            }

            let staticPart = path.slice(staticPartStartIndex, j);
            if (staticPart) {
              staticPart = staticPart.replaceAll('::', ':');
              regexps.push((backtrack = escapeRegExp(staticPart)));
            }

            lastParamStartIndex = j + 1;

            if (isEndOfNode || path.charCodeAt(j) === 47 || j === path.length) {
              const nodePattern = isRegexNode ? '()' + staticPart : staticPart;

              path = path.slice(0, i + 1) + nodePattern + path.slice(j);
              i += nodePattern.length;

              const regex = isRegexNode
                ? new RegExp('^' + regexps.join('') + '$')
                : null;
              currentNode = currentNode.createParametricChild(
                regex,
                staticPart || null,
              );
              currentNode.params = params.slice();
              parentNodePathIndex = i + 1;
              break;
            }
          }
        }
      } else if (isWildcardNode) {
        params.push('*');
        currentNode = currentNode.createWildcardChild();
        currentNode.params = ['*'];
        parentNodePathIndex = i + 1;

        if (i !== path.length - 1) {
          throw new Error('Wildcard must be the last character in the route');
        }
      }
    }
    currentNode.addHandler(handler);
  }

  match(method: string, path: string): Result<T> {
    let currentNode = this.#trees.get(method);
    if (!currentNode) return null;

    const originPath = path;
    let pathIndex = currentNode.prefix.length;
    const params: ParamStash = [];
    const pathLen = path.length;
    const brothersNodesStack: BrotherNode<T>[] = [];
    const matchedHandlers: [T, ParamIndexMap][] = [];

    while (true) {
      if (currentNode.handlers.length > 0) {
        const paramIndexMap: ParamIndexMap = {};
        for (let i = 0; i < currentNode.params.length; i++) {
          paramIndexMap[currentNode.params[i]] = i;
        }
        for (const {handler} of currentNode.handlers) {
          matchedHandlers.push([handler, paramIndexMap]);
        }
      }

      if (
        currentNode.wildcardChild &&
        currentNode.wildcardChild.handlers.length > 0
      ) {
        for (const {handler} of currentNode.wildcardChild.handlers) {
          matchedHandlers.push([handler, {}]);
        }
      }

      if (pathIndex === pathLen) {
        if (matchedHandlers.length > 0) {
          return [matchedHandlers, params];
        }
        return null;
      }

      let node = currentNode.getNextNode(
        path,
        pathIndex,
        brothersNodesStack,
        params.length,
      );

      if (node === null) {
        if (brothersNodesStack.length === 0) {
          return matchedHandlers.length > 0 ? [matchedHandlers, params] : null;
        }
        const brotherNodeState = brothersNodesStack.pop()!;
        pathIndex = brotherNodeState.brotherPathIndex;
        params.length = brotherNodeState.paramsCount;
        node = brotherNodeState.brotherNode;
      }

      currentNode = node;

      if (currentNode.type === NodeType.STATIC) {
        pathIndex += currentNode.prefix.length;
        continue;
      }

      if (currentNode.type === NodeType.WILDCARD) {
        params.push(originPath.slice(pathIndex));
        pathIndex = pathLen;
        continue;
      }

      let paramEndIndex = originPath.indexOf('/', pathIndex);
      if (paramEndIndex === -1) paramEndIndex = pathLen;

      const param = originPath.slice(pathIndex, paramEndIndex);

      if (currentNode.isRegex) {
        if (!currentNode.regex!.test(param)) continue;

        const matchedParameters = currentNode.regex!.exec(param);
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

  prettyPrint(method?: string): string {
    if (!method) {
      const methods = Array.from(this.#trees.keys());
      if (methods.length === 0) return '(empty router)';
      return methods.map(m => `\n${m}:\n${this.prettyPrint(m)}`).join('\n');
    }
    const tree = this.#trees.get(method);
    if (!tree) return '(empty tree)';
    return prettyPrint(tree, '', true);
  }
}
