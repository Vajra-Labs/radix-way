/**
 * Type representing a map of parameter indices.
 */
export type ParamIndexMap = Record<string, number>;

/**
 * Type representing a stash of parameters (array of param values).
 */
export type ParamStash = string[];

/**
 * Type representing a map of parameters.
 */
export type Params = Record<string, string>;

/**
 * Result type with middleware support.
 *
 * Returns an array of [handler, paramIndexMap] tuples and a param stash array.
 * The handlers are in order from least specific to most specific (middleware → final handler).
 *
 * Example:
 * ```typescript
 * [
 *   [
 *     [loggerMiddleware, {}],                // '*' - matches all routes
 *     [authMiddleware,   {}],                // '/api/*' - matches /api/**
 *     [userHandler,      {'id': 0}],         // '/api/users/:id' - final handler
 *   ],
 *   ['123'] // param values
 * ]
 * ```
 */
export type Result<T> = [[T, ParamIndexMap][], ParamStash] | null;

export enum NodeType {
  STATIC,
  PARAM,
  WILDCARD,
}
