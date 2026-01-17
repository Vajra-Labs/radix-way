import {escapeRegExp} from './router';
import type {ParamIndexMap} from './types';
import {Null, trimRegExpStartAndEnd, getClosingBracePosition} from './utils';

/**
 * Convert route pattern to regular expression with parameter mapping
 * @param pattern - Route pattern string (e.g., '/users/:id')
 * @returns Tuple containing compiled regex and parameter index mapping
 */
export function routeToRegExp(pattern: string): [RegExp, ParamIndexMap] {
  if (!pattern) {
    throw new SyntaxError('The first character of a path should be `/` or `*`');
  }

  let paramIndex = 0;
  const params = new Null();
  const reSegments = [];
  const segments = pattern.split('/');

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    if (segment === '*') {
      if (i !== segments.length - 1)
        throw new SyntaxError(
          'Wildcard "*" must be the last character in the route',
        );
      params['*'] = paramIndex++;
      reSegments.push('(.*)');
    } else if (segment.includes(':')) {
      let result = '';
      let i = 0;
      while (i < segment.length) {
        if (segment[i] === ':') {
          let j = i + 1;
          let paramName = '';
          while (j < segment.length && /\w/.test(segment[j])) {
            paramName += segment[j++];
          }
          if (segment[j] === '?') {
            throw new SyntaxError('Optional parameters are not supported');
          }
          let regex = null;
          if (segment[j] === '{') {
            const end = getClosingBracePosition(segment, j);
            regex = trimRegExpStartAndEnd(segment.slice(j + 1, end));
            j = end + 1;
          }
          params[paramName] = paramIndex++;
          result += regex ? `(${regex})` : '([^/]+)';
          i = j;
        } else {
          result += segment[i] === '.' ? '\\.' : segment[i];
          i++;
        }
      }
      reSegments.push(result);
    } else {
      reSegments.push(escapeRegExp(segment));
    }
  }

  const regexPattern = `^/${reSegments.join('/')}/?$`;
  return [new RegExp(regexPattern), params];
}
