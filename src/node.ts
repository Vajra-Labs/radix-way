import {NodeType} from './types';

type ParamNode<T> = {
  regex: RegExp | null;
  staticSuffix: string | null;
  node: Node<T>;
};

type HandlerEntry<T> = {
  handler: T;
};

export class Node<T> {
  type: NodeType;
  prefix: string;
  staticChildren: Map<string, Node<T>> = new Map();
  parametricChildren: ParamNode<T>[] = [];
  parametricChildMap: Map<string, Node<T>> = new Map();
  wildcardChild: Node<T> | null = null;
  handlers: HandlerEntry<T>[] = [];
  isRegex: boolean = false;
  regex: RegExp | null = null;
  params: string[] = [];
  private matchPrefixFn: (path: string, idx: number) => boolean;

  constructor(type: NodeType, prefix: string) {
    this.type = type;
    this.prefix = prefix;
    this.matchPrefixFn = this.compileMatchPrefix(prefix);
  }

  addHandler(handler: T): void {
    this.handlers.push({handler});
  }

  createStaticChild(path: string): Node<T> {
    let currentNode: Node<T> = this;
    let pathIndex = 0;

    while (pathIndex < path.length) {
      const label = path[pathIndex];
      let child = currentNode.staticChildren.get(label);

      if (!child) {
        const newChild = new Node<T>(NodeType.STATIC, path.slice(pathIndex));
        currentNode.staticChildren.set(label, newChild);
        return newChild;
      }

      let i = 0;
      const childPrefixLen = child.prefix.length;
      for (; i < childPrefixLen && pathIndex + i < path.length; i++) {
        if (path[pathIndex + i] !== child.prefix[i]) {
          child = currentNode.split(child, i);
          break;
        }
      }

      pathIndex += childPrefixLen;
      currentNode = child;
    }

    return currentNode;
  }

  private split(child: Node<T>, length: number): Node<T> {
    const splitPrefix = child.prefix.substring(0, length);
    child.prefix = child.prefix.substring(length);

    const splitNode = new Node<T>(NodeType.STATIC, splitPrefix);
    splitNode.staticChildren.set(child.prefix[0], child);
    this.staticChildren.set(splitNode.prefix[0], splitNode);

    return splitNode;
  }

  findStaticMatchingChild(path: string, pathIndex: number): Node<T> | null {
    const staticChild = this.staticChildren.get(path.charAt(pathIndex));
    if (
      staticChild === undefined ||
      !staticChild.matchPrefixFn(path, pathIndex)
    ) {
      return null;
    }
    return staticChild;
  }

  private compileMatchPrefix(
    prefix: string,
  ): (path: string, idx: number) => boolean {
    const len = prefix.length;
    if (len <= 1) return () => true;

    const codes = new Uint16Array(len - 1);
    for (let i = 1; i < len; i++) {
      codes[i - 1] = prefix.charCodeAt(i);
    }

    return (path: string, idx: number) => {
      const end = idx + codes.length + 1;
      if (path.length < end) return false;
      for (let j = 0; j < codes.length; j++) {
        if (path.charCodeAt(idx + 1 + j) !== codes[j]) return false;
      }
      return true;
    };
  }

  createParametricChild(
    regex: RegExp | null,
    staticSuffix: string | null,
  ): Node<T> {
    const key = (regex?.source || 'NOREG') + ':' + (staticSuffix || 'NOSUFFIX');
    const existing = this.parametricChildMap.get(key);

    if (existing) return existing;

    const parametricChild = new Node<T>(NodeType.PARAM, '');
    parametricChild.isRegex = !!regex;
    parametricChild.regex = regex;

    this.parametricChildren.push({
      regex,
      staticSuffix,
      node: parametricChild,
    });

    this.parametricChildMap.set(key, parametricChild);

    this.parametricChildren.sort((child1, child2) => {
      if (!child1.regex) return 1;
      if (!child2.regex) return -1;
      if (child1.staticSuffix === null) return 1;
      if (child2.staticSuffix === null) return -1;
      if (child2.staticSuffix.endsWith(child1.staticSuffix)) return 1;
      if (child1.staticSuffix.endsWith(child2.staticSuffix)) return -1;
      return 0;
    });

    return parametricChild;
  }

  createWildcardChild(): Node<T> {
    this.wildcardChild = this.wildcardChild || new Node(NodeType.WILDCARD, '*');
    return this.wildcardChild;
  }

  getNextNode(
    path: string,
    pathIndex: number,
    nodeStack: Array<{
      brotherPathIndex: number;
      paramsCount: number;
      brotherNode: Node<T>;
    }>,
    paramsCount: number,
  ): Node<T> | null {
    let node = this.findStaticMatchingChild(path, pathIndex);
    let parametricBrotherNodeIndex = 0;

    if (node === null) {
      if (this.parametricChildren.length === 0) {
        return this.wildcardChild;
      }

      node = this.parametricChildren[0].node;
      parametricBrotherNodeIndex = 1;
    }

    if (this.wildcardChild !== null) {
      nodeStack.push({
        paramsCount,
        brotherPathIndex: pathIndex,
        brotherNode: this.wildcardChild,
      });
    }

    for (
      let i = this.parametricChildren.length - 1;
      i >= parametricBrotherNodeIndex;
      i--
    ) {
      nodeStack.push({
        paramsCount,
        brotherPathIndex: pathIndex,
        brotherNode: this.parametricChildren[i].node,
      });
    }

    return node;
  }
}
