/**
 * A list-like stash containing parameter values
 * extracted from a matched route.
 *
 * Order corresponds to the parameter index map.
 */
export type ParamStash = string[];

/**
 * Maps route parameter names to their index
 * in the {@link ParamStash}.
 *
 * Example:
 * `{ id: 0, slug: 1 }`
 */
export type ParamIndexMap = Record<string, number>;

/**
 * Result returned from a route match operation.
 *
 * Tuple structure:
 * - Matched handler value
 * - Parameter index map
 * - Parameter value stash
 *
 * Returns `null` when no route matches.
 */
export type Result<T> = [T, ParamIndexMap, ParamStash] | null;

/**
 * Internal handler record used by the router.
 *
 * Tuple structure:
 * - Handler value
 * - Parameter index map
 */
export type HandlerRecord<T> = [T, ParamIndexMap];
