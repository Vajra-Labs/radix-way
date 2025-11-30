export const NODE_TYPES = {
  STATIC: 0,
  PARAMETRIC: 1,
  WILDCARD: 2,
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
export type HandlerRecord<T> = [T, Record<string, number>];

export class Node<T> {
  handlers: Map<string, HandlerRecord<T>[]> | null = null;
  isLeafNode = false;

  addHandler(method: string, handler: T, paramMap: Record<string, number>) {
    if (this.handlers === null) this.handlers = new Map();
    this.isLeafNode = true;
    let list = this.handlers.get(method);
    if (!list) {
      list = [];
      this.handlers.set(method, list);
    }
    list.push([handler, paramMap]);
  }
}

export class ParentNode<T> extends Node<T> {
  staticChildren: Map<string, StaticNode<T>> = new Map();

  findStaticMatchingChild(
    path: string,
    pathIndex: number,
  ): StaticNode<T> | null {
    if (pathIndex >= path.length) return null;
    const child = this.staticChildren.get(path[pathIndex]);
    if (!child) return null;
    if (!child.matchPrefix(path, pathIndex)) return null;
    return child;
  }

  getStaticChild(path: string, pathIndex = 0): StaticNode<T> | null {
    if (path.length === pathIndex) return this as unknown as StaticNode<T>;
    const child = this.findStaticMatchingChild(path, pathIndex);
    if (child)
      return child.getStaticChild(path, pathIndex + child.prefix.length);
    return null;
  }

  createStaticChild(path: string): StaticNode<T> {
    if (path.length === 0) return this as unknown as StaticNode<T>;

    const first = path[0];
    let child = this.staticChildren.get(first);
    if (child) {
      let i = 1;
      const cl = child.prefix.length;
      // find divergence
      for (; i < cl && i < path.length; i++) {
        if (path.charCodeAt(i) !== child.prefix.charCodeAt(i)) {
          child = child.split(this, i);
          break;
        }
      }
      // If path is shorter than prefix, split at path length
      if (i === path.length && i < cl) {
        child = child.split(this, i);
      }
      return child.createStaticChild(path.slice(i));
    }

    const n = new StaticNode<T>(path);
    this.staticChildren.set(first, n);
    return n;
  }
}

export class StaticNode<T> extends ParentNode<T> {
  kind: NodeType = NODE_TYPES.STATIC;
  prefix: string;
  wildcardChild: WildcardNode<T> | null = null;
  parametricChildren: ParametricNode<T>[] = [];
  matchPrefix: (path: string, i: number) => boolean;

  constructor(prefix: string) {
    super();
    this.prefix = prefix;
    this.matchPrefix = this.compile(prefix);
  }

  getParametricChild(regex: RegExp | null): ParametricNode<T> | null {
    const src = regex ? regex.source : null;
    const arr = this.parametricChildren;
    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      const cs = c.regex ? c.regex.source : null;
      if (cs === src) return c;
    }
    return null;
  }

  createParametricChild(
    regex: RegExp | null,
    staticSuffix: string | null,
    nodePath: string,
  ) {
    const existing = this.getParametricChild(regex);
    if (existing) {
      existing.nodePaths.add(nodePath);
      return existing;
    }

    const child = new ParametricNode<T>(regex, staticSuffix, nodePath);
    // insertion point
    const arr = this.parametricChildren;
    let i = arr.length;
    // comparator copied from find-my-way logic (small array, linear insert)
    function cmp(a: ParametricNode<T>, b: ParametricNode<T>) {
      if (!a.isRegex) return 1;
      if (!b.isRegex) return -1;
      if (a.staticSuffix === null) return 1;
      if (b.staticSuffix === null) return -1;
      if (b.staticSuffix!.endsWith(a.staticSuffix!)) return 1;
      if (a.staticSuffix!.endsWith(b.staticSuffix!)) return -1;
      return 0;
    }
    while (i > 0 && cmp(arr[i - 1], child) > 0) i--;
    arr.splice(i, 0, child);
    return child;
  }

  getWildcardChild() {
    return this.wildcardChild;
  }

  createWildcardChild() {
    if (!this.wildcardChild) this.wildcardChild = new WildcardNode<T>();
    return this.wildcardChild;
  }

  split(parent: ParentNode<T>, len: number): StaticNode<T> {
    // length must be > 0 and < this.prefix.length
    const parentPrefix = this.prefix.slice(0, len);
    const childPrefix = this.prefix.slice(len);

    this.prefix = childPrefix;
    this.matchPrefix = this.compile(childPrefix);

    const staticNode = new StaticNode<T>(parentPrefix);
    staticNode.staticChildren.set(childPrefix[0], this);
    parent.staticChildren.set(parentPrefix[0], staticNode);
    return staticNode;
  }

  getNextNode(
    path: string,
    pathIndex: number,
    nodeStack: any[],
    paramsCount: number,
  ) {
    let node: StaticNode<T> | ParametricNode<T> | WildcardNode<T> | null =
      this.findStaticMatchingChild(path, pathIndex);
    let parametricBrotherIndex = 0;

    if (node === null) {
      if (this.parametricChildren.length === 0) return this.wildcardChild;
      node = this.parametricChildren[0];
      parametricBrotherIndex = 1;
    }

    if (this.wildcardChild) {
      nodeStack.push({
        paramsCount,
        brotherPathIndex: pathIndex,
        brotherNode: this.wildcardChild,
      });
    }

    // push parametric brothers in reverse order to pop LIFO
    for (
      let i = this.parametricChildren.length - 1;
      i >= parametricBrotherIndex;
      i--
    ) {
      nodeStack.push({
        paramsCount,
        brotherPathIndex: pathIndex,
        brotherNode: this.parametricChildren[i],
      });
    }

    return node;
  }

  compile(prefix: string) {
    const len = prefix.length;
    if (len <= 1) return () => true;
    const codes = new Uint16Array(len - 1);
    for (let i = 1; i < len; i++) codes[i - 1] = prefix.charCodeAt(i);

    return function matchPrefix(path: string, idx: number) {
      // idx is the position where prefix[0] already matched
      const end = idx + codes.length + 1; // inclusive of first char
      if (path.length < end) return false;
      for (let j = 0; j < codes.length; j++) {
        if (path.charCodeAt(idx + 1 + j) !== codes[j]) return false;
      }
      return true;
    };
  }
}

export class ParametricNode<T> extends ParentNode<T> {
  kind: NodeType = NODE_TYPES.PARAMETRIC;
  isRegex: boolean;
  regex: RegExp | null;
  staticSuffix: string | null;
  nodePaths: Set<string>;

  constructor(
    regex: RegExp | null,
    staticSuffix: string | null,
    nodePath: string,
  ) {
    super();
    this.isRegex = !!regex;
    this.regex = regex || null;
    this.staticSuffix = staticSuffix || null;
    this.nodePaths = new Set([nodePath]);
  }

  getNextNode(path: string, pathIndex: number) {
    return this.findStaticMatchingChild(path, pathIndex);
  }
}

export class WildcardNode<T> extends Node<T> {
  kind: NodeType = NODE_TYPES.WILDCARD;

  getNextNode() {
    return null;
  }
}
