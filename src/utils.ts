import type {StaticNode} from './node';

export const prettyPrint = <T>(
  node: StaticNode<T>,
  prefix = '',
  isRoot = true,
): string => {
  let result = '';

  const formatMethods = (methods: string[]) => methods.join(', ');

  // Root node
  if (isRoot) {
    result += node.prefix || 'root';
    if (node.isLeafNode && node.handlers) {
      const methods = Object.keys(node.handlers);
      result += ' [' + formatMethods(methods) + ']';
    }
    result += '\n';
  } else if (!isRoot) {
    if (node.isLeafNode && node.handlers) {
      const methods = Object.keys(node.handlers);
      result += ' [' + formatMethods(methods) + ']\n';
    } else {
      result += '\n';
    }
  }

  const children: [string, any][] = [];

  if (node.staticChildren) {
    for (const child of Object.values(node.staticChildren)) {
      children.push([child.prefix, child]);
    }
  }

  if (node.parametricChildren) {
    for (const child of node.parametricChildren) {
      const label = Array.from(child.nodePaths).join('|');
      children.push([label, child]);
    }
  }

  if (node.wildcardChild) {
    children.push(['*', node.wildcardChild]);
  }

  children.forEach(([label, child], i) => {
    const isLast = i === children.length - 1;
    const branch = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';

    result +=
      prefix + branch + label + prettyPrint(child, prefix + childPrefix, false);
  });

  return result;
};

export const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
