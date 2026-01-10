import type {ParamIndexMap} from './types';
import {
  escapeRegExp,
  NullObj,
  trimRegExpStartAndEnd,
  getClosingBracePosition,
} from './utils';

// Pre-compiled regex
const DOT_REGEX = /\./g;
const PARAM_REGEX = /:(\w+\??)(?:\{([^}]+)\})?/g;

/**
 * Convert route pattern to regular expression with parameter mapping
 * @param pattern - Route pattern string (e.g., '/users/:id')
 * @returns Tuple containing compiled regex and parameter index mapping
 */
export function routeToRegExp(pattern: string): [RegExp, ParamIndexMap] {
  // Match RadixTree validation - empty string not allowed
  if (!pattern) {
    throw new Error('The first character of a path should be `/` or `*`');
  }

  let paramIndex = 0;
  const params = new NullObj();
  const reSegments = [];
  const segments = pattern.split('/');

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    if (segment === '*') {
      // Wildcard must be the last segment
      if (i !== segments.length - 1)
        throw new Error('Wildcard "*" must be the last character in the route');
      params['*'] = paramIndex++;
      reSegments.push('(.*)');
    } else if (segment.includes(':')) {
      const index = segment.indexOf('{');
      if (index !== -1) getClosingBracePosition(segment, index);
      // Parameter segment - handle regex constraints
      let processedSegment = segment.replace(
        PARAM_REGEX,
        (_, paramName, regex) => {
          // Check for optional parameter
          if (paramName.endsWith('?')) {
            // Optional parameter must be last in path
            if (i !== segments.length - 1)
              throw new Error('Optional parameter must be last in path');
            paramName = paramName.slice(0, -1); // Remove '?'
          }
          params[paramName] = paramIndex++;
          if (regex) return `(${trimRegExpStartAndEnd(regex)})`;
          return '([^/]+)';
        },
      );
      // Escape dots in static parts
      reSegments.push(processedSegment.replace(DOT_REGEX, '\\.'));
    } else {
      // Static segment - escape regex special characters
      reSegments.push(escapeRegExp(segment));
    }
  }

  const regexPattern = `^/${reSegments.join('/')}/?$`;
  return [new RegExp(regexPattern), params];
}
