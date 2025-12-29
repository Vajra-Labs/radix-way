export const METHOD_NAME_ALL = 'ALL' as const;

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

export type ParamStash = string[];

export type ParamIndexMap = Record<string, number>;

export type Params = Record<string, string>;

export type Result<T> = [T[], ParamIndexMap, ParamStash] | null;

export type HandlerSet<T> = [T[], ParamIndexMap];

export type HTTPMethod =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'
  | 'ALL'
  | (string & {});
