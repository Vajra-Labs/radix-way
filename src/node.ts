import {Null} from './utils';
import type {ParamIndexMap, HandlerSet, HTTPMethod} from './types';

export const NODE_TYPES = {
  STATIC: 0,
  PARAMETRIC: 1,
  WILDCARD: 2,
} as const;

export class Node<T> {
  handlers?: Record<HTTPMethod, HandlerSet<T>>;
  isLeafNode = false;

  addHandler(method: HTTPMethod, handler: T, paramMap: ParamIndexMap): void {
    let handlers = this.handlers;
    if (!handlers) {
      handlers = this.handlers = new Null();
      this.isLeafNode = true;
    }
    const existing = handlers![method];
    if (existing) {
      (existing[0] as any).push(handler);
    } else {
      handlers![method] = [[handler], paramMap, null];
    }
  }
}

export class ParentNode<T> extends Node<T> {
  staticChildren = new Map<string, StaticNode<T>>();

  findStaticMatchingChild(
    path: string,
    pathIndex: number,
  ): StaticNode<T> | null {
    if (pathIndex >= path.length) return null;
    const child = this.staticChildren.get(path[pathIndex]!);
    if (!child) return null;
    if (!child.matchPrefix(path, pathIndex)) return null;
    return child;
  }

  createStaticChild(path: string): StaticNode<T> {
    if (path.length === 0) return this as unknown as StaticNode<T>;

    const first = path[0]!;
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
  kind: number = NODE_TYPES.STATIC;
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
      const c = arr[i]!;
      const cs = c!.regex ? c!.regex.source : null;
      if (cs === src) return c!;
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
    // comparator for parametric children ordering (small array, linear insert)
    function cmp(a: ParametricNode<T>, b: ParametricNode<T>) {
      if (!a.isRegex) return 1;
      if (!b.isRegex) return -1;
      if (a.staticSuffix === null) return 1;
      if (b.staticSuffix === null) return -1;
      if (b.staticSuffix!.endsWith(a.staticSuffix!)) return 1;
      if (a.staticSuffix!.endsWith(b.staticSuffix!)) return -1;
      return 0;
    }
    while (i > 0 && cmp(arr[i - 1]!, child) > 0) i--;
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
    staticNode.staticChildren.set(childPrefix[0]!, this);
    parent.staticChildren.set(parentPrefix[0]!, staticNode);
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
      node = this.parametricChildren[0]!;
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
    if (len === 1) return () => true;
    // Generate inline comparisons
    const lines: string[] = [];
    for (let i = 1; i < len; i++) {
      const charCode = prefix.charCodeAt(i);
      lines.push(`path.charCodeAt(idx + ${i}) === ${charCode}`);
    }
    return new Function('path', 'idx', `return ${lines.join(' && ')}`) as any;
  }
}

export class ParametricNode<T> extends ParentNode<T> {
  kind: number = NODE_TYPES.PARAMETRIC;
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
  kind: number = NODE_TYPES.WILDCARD;

  getNextNode() {
    return null;
  }
}
