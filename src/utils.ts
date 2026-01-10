import type {StaticNode} from './node';

export const NullObj = (() => {
  const e = function () {};
  e.prototype = Object.create(null);
  Object.freeze(e.prototype);
  return e;
})() as unknown as {new (): any};

export const formatMethods = (methods: string[]) => methods.join(', ');

export const prettyPrint = <T>(
  node: StaticNode<T>,
  prefix = '',
  isRoot = true,
): string => {
  let out = '';

  if (isRoot) {
    out += `<root>`;
    if (node.isLeafNode && node.handlers) {
      out += ` [${formatMethods(Object.keys(node.handlers))}]`;
    }
    out += '\n';
  } else {
    if (node.isLeafNode && node.handlers) {
      out += ` [${formatMethods(Object.keys(node.handlers))}]\n`;
    } else out += '\n';
  }

  const children: [string, any][] = [];

  if (node.staticChildren) {
    for (const c of node.staticChildren.values()) {
      children.push([c.prefix, c]);
    }
  }

  if (node.parametricChildren) {
    for (const c of node.parametricChildren) {
      children.push([Array.from(c.nodePaths).join('|'), c]);
    }
  }

  if (node.wildcardChild) {
    children.push(['*', node.wildcardChild]);
  }

  children.forEach(([label, child], i) => {
    const last = i === children.length - 1;
    out +=
      prefix +
      (last ? '└─ ' : '├─ ') +
      label +
      prettyPrint(child, prefix + (last ? '   ' : '│  '), false);
  });

  return out;
};

export const trimRegExpStartAndEnd = (regexString: string) => {
  // Only remove ^ and $ if they are regex anchors, NOT part of character classes
  // ^ at position 0 (outside brackets) is an anchor
  // $ at last position (outside brackets) is an anchor
  if (regexString.charCodeAt(0) === 94) {
    // ^ at start (anchor)
    regexString = regexString.slice(1);
  }
  if (regexString.charCodeAt(regexString.length - 1) === 36) {
    // $ at end (anchor)
    regexString = regexString.slice(0, -1);
  }
  return regexString;
};

export const getClosingBracePosition = (
  path: string,
  index: number,
): number => {
  let stack = 1;
  while (index < path.length) {
    index++;
    if (path[index] === '\\') {
      index++;
      continue;
    }
    if (path[index] === '}') stack--;
    if (path[index] === '{') stack++;
    if (stack === 0) return index;
  }
  throw new TypeError(`Invalid regex in "${path}"`);
};

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
export const escapeRegExp = (str: string) => str.replace(ESCAPE_REGEX, '\\$&');
