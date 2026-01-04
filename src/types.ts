/**
 * Special method name that matches all HTTP methods.
 */
export const METHOD_NAME_ALL = 'ALL' as const;

/**
 * Generic router interface.
 *
 * @typeParam T - The handler type stored for each route.
 */
export interface Router<T> {
  /**
   * Registers a new route.
   *
   * @param method - The HTTP method in uppercase (e.g., 'GET', 'POST', 'ALL').
   * @param path - The route path pattern (e.g., '/users/:id').
   * @param handler - The handler associated with the route.
   */
  add(method: HTTPMethod, path: string, handler: T): void;

  /**
   * Attempts to match a route for the given method and path.
   *
   * @param method - The HTTP method (e.g., 'get', 'POST').
   * @param path - The request path to match.
   *
   * @returns
   * - A {@link Result} tuple when a route matches
   * - `null` if no route matches
   */
  match(method: HTTPMethod, path: string): Result<T>;

  /**
   * Print Tree the router's internal tree or lookup structure.
   *
   * Useful for debugging and inspection.
   *
   * @param print - When `true`, logs the output to the console.
   *                When `false` or omitted, returns the string instead.
   *
   * @returns
   * - `void` if `print` is `true`
   * - A formatted string representation otherwise
   */
  printTree(print: true): void;
  printTree(print?: false): string;
  printTree(print?: boolean): void | string;
}

/**
 * Ordered list of parameter values captured during route matching.
 *
 * Indices correspond to entries in {@link ParamIndexMap}.
 */
export type ParamStash = string[];

/**
 * Maps parameter names to their index in the {@link ParamStash}.
 *
 * Example: `{ id: 0, slug: 1 }`
 */
export type ParamIndexMap = Record<string, number>;

/**
 * Key-value mapping of route parameters by name.
 *
 * Example: `{ id: "42", slug: "hello-world" }`
 */
export type Params = Record<string, string>;

/**
 * Result of a route match attempt.
 *
 * - `HandlerSet<T>` when a route matches
 * - `null` when no route matches
 */
export type Result<T> = HandlerSet<T> | null;

/**
 * A matched handler set with optional parameter metadata.
 *
 * Tuple structure:
 * 1. Array of matched handlers
 * 2. Parameter index map (or `null` if no params)
 * 3. Parameter value stash (or `null` if no params)
 */
export type HandlerSet<T> = [T[], ParamIndexMap | null, ParamStash | null];

/**
 * Supported HTTP methods.
 *
 * Includes all standard, WebDAV, and extension methods,
 * plus `ALL` for method-agnostic routes.
 *
 * Allows custom methods via string extension.
 */
// prettier-ignore
export type HTTPMethod =
  | 'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY'
  | 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'LOCK'
  | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL'
  | 'MOVE' | 'NOTIFY' | 'OPTIONS' | 'PATCH' | 'POST'
  | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT'
  | 'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE'
  | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' | 'UNLINK'
  | 'UNLOCK' | 'UNSUBSCRIBE'
  | 'ALL'
  | (string & {});
