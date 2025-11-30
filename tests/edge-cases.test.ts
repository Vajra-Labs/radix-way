import {RadixTree} from '../ts';
import {describe, it, expect} from 'vitest';

describe('Edge Cases', () => {
  describe('URL Encoding', () => {
    it('should decode URL encoded parameters', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:name', 'user');

      const [handlers, params] = router.match('GET', '/users/hello%20world');
      expect(handlers[0][0]).toBe('user');
      expect(params).toEqual(['hello world']);
    });

    it('should handle special characters in params', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/search/:query', 'search');

      const [h, p] = router.match('GET', '/search/hello-world');
      expect(p).toEqual(['hello-world']);
    });
  });

  describe('Multiple Methods', () => {
    it('should handle same path with different methods', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users', 'get-users');
      router.add('POST', '/users', 'create-user');
      router.add('PUT', '/users', 'update-users');
      router.add('DELETE', '/users', 'delete-users');

      expect(router.match('GET', '/users')[0][0][0]).toBe('get-users');
      expect(router.match('POST', '/users')[0][0][0]).toBe('create-user');
      expect(router.match('PUT', '/users')[0][0][0]).toBe('update-users');
      expect(router.match('DELETE', '/users')[0][0][0]).toBe('delete-users');
    });

    it('should handle parametric routes with multiple methods', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:id', 'get-user');
      router.add('PUT', '/users/:id', 'update-user');
      router.add('DELETE', '/users/:id', 'delete-user');

      const [h1, p1] = router.match('GET', '/users/123');
      expect(h1[0][0]).toBe('get-user');
      expect(p1).toEqual(['123']);

      const [h2, p2] = router.match('PUT', '/users/456');
      expect(h2[0][0]).toBe('update-user');
      expect(p2).toEqual(['456']);
    });
  });

  describe('Route Priority', () => {
    it('should prioritize exact static match over parametric', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:id', 'param');
      router.add('GET', '/users/me', 'static');
      router.add('GET', '/users/admin', 'admin');

      expect(router.match('GET', '/users/me')[0][0][0]).toBe('static');
      expect(router.match('GET', '/users/admin')[0][0][0]).toBe('admin');
      expect(router.match('GET', '/users/123')[0][0][0]).toBe('param');
    });

    it('should prioritize parametric over wildcard', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/files/*', 'wildcard');
      router.add('GET', '/files/:id', 'param');

      const [h1, p1] = router.match('GET', '/files/123');
      expect(h1[0][0]).toBe('param');
      expect(p1).toEqual(['123']);

      const [h2, p2] = router.match('GET', '/files/a/b/c');
      expect(h2[0][0]).toBe('wildcard');
      expect(p2).toEqual(['a/b/c']);
    });
  });

  describe('Empty and Root Paths', () => {
    it('should handle root path', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/', 'root');

      const [handlers, params] = router.match('GET', '/');
      expect(handlers[0][0]).toBe('root');
      expect(params).toEqual([]);
    });

    it('should handle root with other routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/', 'root');
      router.add('GET', '/users', 'users');

      expect(router.match('GET', '/')[0][0][0]).toBe('root');
      expect(router.match('GET', '/users')[0][0][0]).toBe('users');
    });
  });

  describe('Long Paths', () => {
    it('should handle deeply nested routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/a/b/c/d/e/f/g/h/i/j', 'deep');

      const [handlers] = router.match('GET', '/a/b/c/d/e/f/g/h/i/j');
      expect(handlers[0][0]).toBe('deep');
    });

    it('should handle many parameters', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/:a/:b/:c/:d/:e', 'params');

      const [handlers, params] = router.match('GET', '/1/2/3/4/5');
      expect(handlers[0][0]).toBe('params');
      expect(params).toEqual(['1', '2', '3', '4', '5']);
    });
  });

  describe('Special Characters in Static Paths', () => {
    it('should handle dots in path', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/api/v1.0/users', 'users');

      expect(router.match('GET', '/api/v1.0/users')[0][0][0]).toBe('users');
    });

    it('should handle hyphens in path', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/my-awesome-route', 'handler');

      expect(router.match('GET', '/my-awesome-route')[0][0][0]).toBe('handler');
    });

    it('should handle underscores in path', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/api_v1_users', 'handler');

      expect(router.match('GET', '/api_v1_users')[0][0][0]).toBe('handler');
    });
  });

  describe('Wildcard Edge Cases', () => {
    it('should match empty wildcard', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/files/*', 'files');

      const [handlers, params] = router.match('GET', '/files/');
      expect(handlers[0][0]).toBe('files');
      expect(params).toEqual(['']);
    });

    it('should match deeply nested wildcard', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/static/*', 'static');

      const [handlers, params] = router.match('GET', '/static/css/vendor/bootstrap/main.min.css');
      expect(handlers[0][0]).toBe('static');
      expect(params).toEqual(['css/vendor/bootstrap/main.min.css']);
    });
  });

  describe('Regex Parameter Edge Cases', () => {
    it('should not match when regex fails', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/posts/:id(\\d+)', 'numeric');

      expect(router.match('GET', '/posts/123')[0][0][0]).toBe('numeric');
      expect(router.match('GET', '/posts/abc')[0]).toEqual([]);
    });

    it('should handle complex regex patterns', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:email([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,})', 'user');

      const [h1, p1] = router.match('GET', '/users/test@example.com');
      expect(h1[0][0]).toBe('user');
      expect(p1).toEqual(['test@example.com']);

      expect(router.match('GET', '/users/invalid')[0]).toEqual([]);
    });
  });

  describe('Options: ignoreTrailingSlash', () => {
    it('should match with trailing slash when enabled', () => {
      const router = new RadixTree<string>({ignoreTrailingSlash: true});
      router.add('GET', '/users', 'users');

      expect(router.match('GET', '/users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/users/')[0][0][0]).toBe('users');
    });

    it('should work with parametric routes', () => {
      const router = new RadixTree<string>({ignoreTrailingSlash: true});
      router.add('GET', '/users/:id', 'user');

      const [h1, p1] = router.match('GET', '/users/123');
      expect(h1[0][0]).toBe('user');
      expect(p1).toEqual(['123']);

      const [h2, p2] = router.match('GET', '/users/123/');
      expect(h2[0][0]).toBe('user');
      expect(p2).toEqual(['123']);
    });

    it('should not match when disabled', () => {
      const router = new RadixTree<string>({ignoreTrailingSlash: false});
      router.add('GET', '/users', 'users');

      expect(router.match('GET', '/users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/users/')[0]).toEqual([]);
    });
  });

  describe('Options: ignoreDuplicateSlashes', () => {
    it('should normalize duplicate slashes when enabled', () => {
      const router = new RadixTree<string>({ignoreDuplicateSlashes: true});
      router.add('GET', '/api/users', 'users');

      expect(router.match('GET', '/api/users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/api//users')[0][0][0]).toBe('users');
      expect(router.match('GET', '//api///users')[0][0][0]).toBe('users');
    });

    it('should work with parametric routes', () => {
      const router = new RadixTree<string>({ignoreDuplicateSlashes: true});
      router.add('GET', '/users/:id/posts', 'posts');

      const [h, p] = router.match('GET', '//users//123//posts');
      expect(h[0][0]).toBe('posts');
      expect(p).toEqual(['123']);
    });

    it('should not normalize when disabled', () => {
      const router = new RadixTree<string>({ignoreDuplicateSlashes: false});
      router.add('GET', '/api/users', 'users');

      expect(router.match('GET', '/api/users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/api//users')[0]).toEqual([]);
    });
  });

  describe('Combined Options', () => {
    it('should handle both options together', () => {
      const router = new RadixTree<string>({
        ignoreTrailingSlash: true,
        ignoreDuplicateSlashes: true,
      });
      router.add('GET', '/api/users/:id', 'user');

      const [h, p] = router.match('GET', '//api//users//123//');
      expect(h[0][0]).toBe('user');
      expect(p).toEqual(['123']);
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case sensitive by default', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/Users', 'users');

      expect(router.match('GET', '/Users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/users')[0]).toEqual([]);
    });
  });

  describe('Common Prefix Optimization', () => {
    it('should handle routes with common prefixes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/api/users', 'users');
      router.add('GET', '/api/posts', 'posts');
      router.add('GET', '/api/comments', 'comments');

      expect(router.match('GET', '/api/users')[0][0][0]).toBe('users');
      expect(router.match('GET', '/api/posts')[0][0][0]).toBe('posts');
      expect(router.match('GET', '/api/comments')[0][0][0]).toBe('comments');
    });

    it('should split nodes correctly', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/static', 'static');
      router.add('GET', '/status', 'status');

      expect(router.match('GET', '/static')[0][0][0]).toBe('static');
      expect(router.match('GET', '/status')[0][0][0]).toBe('status');
    });
  });
});
