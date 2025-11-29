import {RadixTree} from '../ts';
import {describe, it, expect} from 'vitest';

describe('RadixTree', () => {
  describe('Static Routes', () => {
    it('should match static routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users', 'list-users');
      router.add('GET', '/posts', 'list-posts');

      const r1 = router.match('GET', '/users');
      expect(r1[0][0][0]).toBe('list-users');
      expect(r1[1]).toEqual([]);

      const r2 = router.match('GET', '/posts');
      expect(r2[0][0][0]).toBe('list-posts');
      expect(r2[1]).toEqual([]);
    });

    it('should return empty for non-existent routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users', 'handler');

      expect(router.match('GET', '/posts')[0]).toEqual([]);
      expect(router.match('POST', '/users')[0]).toEqual([]);
    });
  });

  describe('Parametric Routes', () => {
    it('should match simple parametric routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:id', 'get-user');

      const [handlers, params] = router.match('GET', '/users/123');
      expect(handlers[0][0]).toBe('get-user');
      expect(handlers[0][1]).toEqual({id: 0});
      expect(params).toEqual(['123']);
    });

    it('should match multiple parameters', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:userId/posts/:postId', 'get-post');

      const [handlers, params] = router.match('GET', '/users/42/posts/99');
      expect(handlers[0][0]).toBe('get-post');
      expect(handlers[0][1]).toEqual({userId: 0, postId: 1});
      expect(params).toEqual(['42', '99']);
    });
  });

  describe('Regex Parameters', () => {
    it('should match regex parameters', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/posts/:id(\\d+)', 'get-post-by-id');

      const [handlers, params] = router.match('GET', '/posts/123');
      expect(handlers[0][0]).toBe('get-post-by-id');
      expect(params).toEqual(['123']);

      expect(router.match('GET', '/posts/abc')[0]).toEqual([]);
    });

    it('should match different regex patterns', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/posts/:id(\\d+)', 'numeric');
      router.add('GET', '/posts/:slug([a-z-]+)', 'slug');

      const [h1, p1] = router.match('GET', '/posts/123');
      expect(h1[0][0]).toBe('numeric');
      expect(p1).toEqual(['123']);

      const [h2, p2] = router.match('GET', '/posts/my-post');
      expect(h2[0][0]).toBe('slug');
      expect(p2).toEqual(['my-post']);
    });
  });

  describe('Multi-parameters', () => {
    it('should match multi-parameters with dash', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/at/:hour-:minute', 'get-time');

      const [handlers, params] = router.match('GET', '/at/14-30');
      expect(handlers[0][0]).toBe('get-time');
      expect(params).toEqual(['14', '30']);
    });

    it('should match multi-parameters with dot', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/file.:name.:ext', 'get-file');

      const [handlers, params] = router.match('GET', '/file.readme.md');
      expect(handlers[0][0]).toBe('get-file');
      expect(params).toEqual(['readme', 'md']);
    });
  });

  describe('Static Suffix', () => {
    it('should match static suffix', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/file.:ext', 'get-file');

      const [h1, p1] = router.match('GET', '/file.pdf');
      expect(h1[0][0]).toBe('get-file');
      expect(p1).toEqual(['pdf']);

      const [h2, p2] = router.match('GET', '/file.jpg');
      expect(h2[0][0]).toBe('get-file');
      expect(p2).toEqual(['jpg']);
    });

    it('should match param with static suffix', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/image-:id.png', 'get-image');

      const [handlers, params] = router.match('GET', '/image-42.png');
      expect(handlers[0][0]).toBe('get-image');
      expect(params).toEqual(['42']);

      expect(router.match('GET', '/image-42.jpg')[0]).toEqual([]);
    });
  });

  describe('Optional Parameters', () => {
    it('should match with and without optional param', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/items/:id?', 'get-items');

      const [h1, p1] = router.match('GET', '/items');
      expect(h1[0][0]).toBe('get-items');
      expect(p1).toEqual([]);

      const [h2, p2] = router.match('GET', '/items/123');
      expect(h2[0][0]).toBe('get-items');
      expect(p2).toEqual(['123']);
    });
  });

  describe('Wildcard Routes', () => {
    it('should match wildcard routes', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/files/*', 'serve-file');

      const [h1, p1] = router.match('GET', '/files/docs/readme.md');
      expect(h1[0][0]).toBe('serve-file');
      expect(p1).toEqual(['docs/readme.md']);

      const [h2, p2] = router.match('GET', '/files/a/b/c/d.txt');
      expect(h2[0][0]).toBe('serve-file');
      expect(p2).toEqual(['a/b/c/d.txt']);
    });
  });

  describe('Double Colon Escape', () => {
    it('should handle double colon as single colon', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/name::customVerb', 'custom');

      const [handlers, params] = router.match('GET', '/name:customVerb');
      expect(handlers[0][0]).toBe('custom');
      expect(params).toEqual([':customVerb']);
    });
  });

  describe('Route Priority', () => {
    it('should prioritize static over parametric', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:id', 'param');
      router.add('GET', '/users/me', 'static');

      const [h1, p1] = router.match('GET', '/users/me');
      expect(h1[0][0]).toBe('static');
      expect(p1).toEqual([]);

      const [h2, p2] = router.match('GET', '/users/123');
      expect(h2[0][0]).toBe('param');
      expect(p2).toEqual(['123']);
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

  describe('HTTP Methods', () => {
    it('should handle different HTTP methods', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users', 'get');
      router.add('POST', '/users', 'post');
      router.add('PUT', '/users', 'put');
      router.add('DELETE', '/users', 'delete');

      expect(router.match('GET', '/users')[0][0][0]).toBe('get');
      expect(router.match('POST', '/users')[0][0][0]).toBe('post');
      expect(router.match('PUT', '/users')[0][0][0]).toBe('put');
      expect(router.match('DELETE', '/users')[0][0][0]).toBe('delete');
    });
  });

  describe('Edge Cases', () => {
    it('should handle root path', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/', 'root');

      const [handlers, params] = router.match('GET', '/');
      expect(handlers[0][0]).toBe('root');
      expect(params).toEqual([]);
    });

    it('should handle empty params', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users', 'handler');

      const [handlers, params] = router.match('GET', '/users');
      expect(handlers[0][0]).toBe('handler');
      expect(params).toEqual([]);
    });

    it('should handle special characters in params', () => {
      const router = new RadixTree<string>();
      router.add('GET', '/users/:id', 'handler');

      const [handlers, params] = router.match('GET', '/users/user-123');
      expect(handlers[0][0]).toBe('handler');
      expect(params).toEqual(['user-123']);
    });
  });
});
