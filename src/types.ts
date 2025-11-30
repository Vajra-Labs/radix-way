/**
 * Interface representing a router.
 */
export interface Router<T> {
  /**
   * Adds a route to the router.
   *
   * @param method - The HTTP method (e.g., 'get', 'post').
   * @param path - The path for the route.
   * @param handler - The handler for the route.
   */
  add(method: string, path: string, handler: T): void;

  /**
   * Matches a route based on the given method and path.
   *
   * @param method - The HTTP method (e.g., 'get', 'post').
   * @param path - The path to match.
   * @returns The result of the match.
   */
  match(method: string, path: string): Result<T>;
}

/**
 * Type representing a map of parameter indices.
 */
export type ParamIndexMap = Record<string, number>;

/**
 * Type representing a stash of parameters.
 */
export type ParamStash = string[];

/**
 * Type representing the result of a route match.
 */
export type Result<T> = [[T, ParamIndexMap][], ParamStash];
