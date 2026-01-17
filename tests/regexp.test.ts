import {describe, it, expect} from 'vitest';
import {routeToRegExp} from '../src/regexp';

describe('routeToRegExp', () => {
  it('should handle static routes', () => {
    const [regex, params] = routeToRegExp('/users');
    expect(regex.source).toBe('^\\/users\\/?$');
    expect(params).toEqual({});
    expect(regex.test('/users')).toBe(true);
    expect(regex.test('/users/')).toBe(true);
    expect(regex.test('/users/123')).toBe(false);
  });

  it('should handle simple parameters', () => {
    const [regex, params] = routeToRegExp('/users/:id');
    expect(regex.source).toBe('^\\/users\\/([^/]+)\\/?$');
    expect(params).toEqual({id: 0});

    const match = regex.exec('/users/123');
    expect(match).toBeTruthy();
    expect(match![1]).toBe('123');
  });

  it('should handle multiple parameters', () => {
    const [regex, params] = routeToRegExp('/users/:userId/posts/:postId');
    expect(regex.source).toBe('^\\/users\\/([^/]+)\\/posts\\/([^/]+)\\/?$');
    expect(params).toEqual({userId: 0, postId: 1});

    const match = regex.exec('/users/42/posts/99');
    expect(match).toBeTruthy();
    expect(match![1]).toBe('42');
    expect(match![2]).toBe('99');
  });

  it('should handle regex constraints', () => {
    const [regex, params] = routeToRegExp('/users/:id{\\d+}');
    expect(regex.source).toBe('^\\/users\\/(\\d+)\\/?$');
    expect(params).toEqual({id: 0});

    expect(regex.test('/users/123')).toBe(true);
    expect(regex.test('/users/abc')).toBe(false);
  });

  it('should handle regex constraints with anchors', () => {
    const [regex, params] = routeToRegExp('/users/:id{^\\d+$}');
    expect(regex.source).toBe('^\\/users\\/(\\d+)\\/?$');
    expect(params).toEqual({id: 0});

    expect(regex.test('/users/123')).toBe(true);
    expect(regex.test('/users/abc')).toBe(false);
  });

  it('should handle wildcard', () => {
    const [regex, params] = routeToRegExp('/files/*');
    expect(regex.source).toBe('^\\/files\\/(.*)\\/?$');
    expect(params).toEqual({'*': 0});

    const match = regex.exec('/files/image.jpg');
    expect(match).toBeTruthy();
    expect(match![1]).toBe('image.jpg');

    // Should also match multiple segments
    const match2 = regex.exec('/files/docs/readme.md');
    expect(match2).toBeTruthy();
    expect(match2![1]).toBe('docs/readme.md');
  });

  it('should throw error for wildcard not at end', () => {
    expect(() => routeToRegExp('/*/name/hello')).toThrow(
      'Wildcard "*" must be the last character in the route',
    );
    expect(() => routeToRegExp('/files/*/backup')).toThrow(
      'Wildcard "*" must be the last character in the route',
    );
  });

  it('should throw error for malformed braces', () => {
    expect(() => routeToRegExp('/users/:id{\\d+')).toThrow('Invalid regex in');
    expect(() => routeToRegExp('/users/:id{{\\d+}')).toThrow(
      'Invalid regex in',
    );
    expect(() => routeToRegExp('/users/:id{\\d+{test}')).toThrow(
      'Invalid regex in',
    );
  });

  it('should throw error for optional parameter not at end', () => {
    expect(() => routeToRegExp('/posts/:category?/:slug?')).toThrow(
      'Optional parameters are not supported',
    );
    expect(() => routeToRegExp('/users/:id?/profile')).toThrow(
      'Optional parameters are not supported',
    );
  });

  it('should handle mixed parameters and static text', () => {
    const [regex, params] = routeToRegExp('/api/v:version/users/:id');
    expect(regex.source).toBe('^\\/api\\/v([^/]+)\\/users\\/([^/]+)\\/?$');
    expect(params).toEqual({version: 0, id: 1});

    const match = regex.exec('/api/v1/users/123');
    expect(match).toBeTruthy();
    expect(match![1]).toBe('1');
    expect(match![2]).toBe('123');
  });

  it('should handle parameters with dots', () => {
    const [regex, params] = routeToRegExp('/file.:name.:ext');
    expect(regex.source).toBe('^\\/file\\.([^/]+)\\.([^/]+)\\/?$');
    expect(params).toEqual({name: 0, ext: 1});

    const match = regex.exec('/file.config.json');
    expect(match).toBeTruthy();
    expect(match![1]).toBe('config');
    expect(match![2]).toBe('json');
  });

  it('should escape special regex characters in static segments', () => {
    const [regex, params] = routeToRegExp('/api/v1.0/users');
    expect(regex.source).toBe('^\\/api\\/v1\\.0\\/users\\/?$');
    expect(params).toEqual({});

    expect(regex.test('/api/v1.0/users')).toBe(true);
    expect(regex.test('/api/v1x0/users')).toBe(false);
  });

  it('should handle complex regex patterns', () => {
    const [regex, params] = routeToRegExp('/posts/:slug{[a-z0-9-]+}');
    expect(regex.source).toBe('^\\/posts\\/([a-z0-9-]+)\\/?$');
    expect(params).toEqual({slug: 0});

    expect(regex.test('/posts/hello-world-123')).toBe(true);
    expect(regex.test('/posts/Hello-World')).toBe(false);
  });

  it('should handle root path', () => {
    const [regex, params] = routeToRegExp('/');
    expect(regex.source).toBe('^\\/\\/?$');
    expect(params).toEqual({});

    expect(regex.test('/')).toBe(true);
    expect(regex.test('//')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(() => routeToRegExp('')).toThrow(
      'The first character of a path should be `/` or `*`',
    );
  });
});
