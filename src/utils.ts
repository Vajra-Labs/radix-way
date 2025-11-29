import {Node} from './node';

export const ESCAPE_REGEXP = /[.*+?^${}()|[\]\\]/g;

export const escapeRegExp = (string: string): string =>
  string.replace(ESCAPE_REGEXP, '\\$&');

export const trimRegExpStartAndEnd = (regexString: string): string => {
  if (regexString.charCodeAt(1) === 94) {
    // ^
    regexString = regexString.slice(0, 1) + regexString.slice(2);
  }
  if (regexString.charCodeAt(regexString.length - 2) === 36) {
    // $
    regexString =
      regexString.slice(0, regexString.length - 2) +
      regexString.slice(regexString.length - 1);
  }
  return regexString;
};

export const getClosingParenthesesPosition = (
  path: string,
  idx: number,
): number => {
  let parentheses = 1;
  while (idx < path.length) {
    idx++;
    if (path.charCodeAt(idx) === 92) {
      // backslash
      idx++;
      continue;
    }
    if (path.charCodeAt(idx) === 41)
      parentheses--; // )
    else if (path.charCodeAt(idx) === 40) parentheses++; // (

    if (!parentheses) return idx;
  }
  throw new TypeError('Invalid regexp expression in "' + path + '"');
};

export const prettyPrint = (
  node: Node<any>,
  prefix: string,
  isLast: boolean,
): string => {
  let result = '';
  const connector = isLast ? '└── ' : '├── ';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');

  if (node.prefix) {
    result += prefix + connector + node.prefix;
    if (node.prefix === '/' && prefix === '') {
      result += ' (root)';
    }
    if (node.handlers.length > 0) {
      result += ` (${node.handlers.length} handler${node.handlers.length > 1 ? 's' : ''})`;
    }
    result += '\n';
  }

  const staticChildren = Array.from(node.staticChildren.values());
  staticChildren.forEach((child, i) => {
    const isLastChild =
      i === staticChildren.length - 1 &&
      node.parametricChildren.length === 0 &&
      !node.wildcardChild;
    result += prettyPrint(child, childPrefix, isLastChild);
  });

  node.parametricChildren.forEach((paramChild, i) => {
    const isLastChild =
      i === node.parametricChildren.length - 1 && !node.wildcardChild;
    result += childPrefix + (isLastChild ? '└── ' : '├── ') + ':param';
    if (paramChild.node.handlers.length > 0) {
      result += ` (${paramChild.node.handlers.length} handler${paramChild.node.handlers.length > 1 ? 's' : ''})`;
    }
    result += '\n';
  });

  if (node.wildcardChild) {
    result += childPrefix + '└── *';
    if (node.wildcardChild.handlers.length > 0) {
      result += ` (${node.wildcardChild.handlers.length} handler${node.wildcardChild.handlers.length > 1 ? 's' : ''})`;
    }
    result += '\n';
  }

  return result;
};
