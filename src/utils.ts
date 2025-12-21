import type {StaticNode} from './node';
import ansis, {type Ansis} from 'ansis';

const methodColors: Record<string, Ansis> = {
  GET: ansis.green,
  POST: ansis.blue,
  PUT: ansis.yellow,
  DELETE: ansis.magenta,
  PATCH: ansis.cyan,
};

export const prettyPrint = <T>(
  node: StaticNode<T>,
  prefix = '',
  isRoot = true,
): string => {
  let result = '';

  const formatMethods = (methods: string[]) =>
    methods.map(m => (methodColors[m] ?? ansis.cyan)(m)).join(ansis.gray(', '));

  // Root node
  if (isRoot && node.isLeafNode && node.handlers) {
    const methods = Object.keys(node.handlers);
    result += ansis.gray('[') + formatMethods(methods) + ansis.gray(']') + '\n';
  } else if (!isRoot) {
    if (node.isLeafNode && node.handlers) {
      const methods = Object.keys(node.handlers);
      result +=
        ' ' + ansis.gray('[') + formatMethods(methods) + ansis.gray(']') + '\n';
    } else {
      result += '\n';
    }
  }

  const children: [string, any, (s: string) => string][] = [];

  if (node.staticChildren) {
    for (const child of Object.values(node.staticChildren)) {
      children.push([child.prefix, child, ansis.dim]);
    }
  }

  if (node.parametricChildren) {
    for (const child of node.parametricChildren) {
      const label = Array.from(child.nodePaths).join(
        ansis.gray('|') + ansis.yellow(''),
      );
      children.push([label, child, ansis.yellow]);
    }
  }

  if (node.wildcardChild) {
    children.push(['*', node.wildcardChild, ansis.magenta]);
  }

  children.forEach(([label, child, color], i) => {
    const isLast = i === children.length - 1;
    const branch = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';

    result +=
      ansis.gray(prefix + branch) +
      color(label) +
      prettyPrint(child, prefix + childPrefix, false);
  });

  return result;
};

const ESCAPE_REGEXP = /[.*+?^${}()|[\]\\]/g;
export const escapeRegExp = (str: string) => str.replace(ESCAPE_REGEXP, '\\$&');
export const trimRegExpStartAndEnd = (regexString: string) => {
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
export const getClosingParenthesesPosition = (
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
    if (path[index] === ')') stack--;
    if (path[index] === '(') stack++;
    if (stack === 0) return index;
  }
  throw new TypeError(`Invalid regex in "${path}"`);
};
