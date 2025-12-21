import {RadixTree} from '../src/router';
import {describe, it, expect, beforeEach} from 'vitest';

describe('RadixTree', () => {
  describe('Static Routes', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match static routes', () => {
      router.add('GET', '/users', 'list-users');
      router.add('GET', '/posts', 'list-posts');
      const r1 = router.match('GET', '/users');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('list-users');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/posts');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('list-posts');
      expect(r2![2]).toEqual([]);
    });

    it('should return empty for non-existent routes', () => {
      router.add('GET', '/users', 'handler');
      expect(router.match('GET', '/posts')).toBeNull();
      expect(router.match('POST', '/users')).toBeNull();
    });
  });

  describe('Parametric Routes', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match simple parametric routes', () => {
      router.add('GET', '/users/:id', 'get-user');
      const result = router.match('GET', '/users/123');
      expect(result).not.toBeNull();
      const [handler, paramMap, params] = result!;
      expect(handler).toBe('get-user');
      expect(paramMap).toEqual({id: 0});
      expect(params).toEqual(['123']);
    });

    it('should match multiple parameters', () => {
      router.add('GET', '/users/:userId/posts/:postId', 'get-post');
      const result = router.match('GET', '/users/42/posts/99');
      expect(result).not.toBeNull();
      const [handler, paramMap, params] = result!;
      expect(handler).toBe('get-post');
      expect(paramMap).toEqual({userId: 0, postId: 1});
      expect(params).toEqual(['42', '99']);
    });
  });

  describe('Regex Parameters', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match regex parameters', () => {
      router.add('GET', '/posts/:id(\\d+)', 'get-post-by-id');
      const result = router.match('GET', '/posts/123');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('get-post-by-id');
      expect(params).toEqual(['123']);
      expect(router.match('GET', '/posts/abc')).toBeNull();
    });

    it('should match different regex patterns', () => {
      router.add('GET', '/posts/:id(\\d+)', 'numeric');
      router.add('GET', '/posts/:slug([a-z-]+)', 'slug');
      const r1 = router.match('GET', '/posts/123');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('numeric');
      expect(r1![2]).toEqual(['123']);
      const r2 = router.match('GET', '/posts/my-post');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('slug');
      expect(r2![2]).toEqual(['my-post']);
    });
  });

  describe('Multi-parameters', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match multi-parameters with dash', () => {
      router.add('GET', '/at/:hour-:minute', 'get-time');
      const result = router.match('GET', '/at/14-30');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('get-time');
      expect(params).toEqual(['14', '30']);
    });

    it('should match multi-parameters with dot', () => {
      router.add('GET', '/file.:name.:ext', 'get-file');
      const result = router.match('GET', '/file.readme.md');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('get-file');
      expect(params).toEqual(['readme', 'md']);
    });
  });

  describe('Static Suffix', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match static suffix', () => {
      router.add('GET', '/file.:ext', 'get-file');
      const r1 = router.match('GET', '/file.pdf');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('get-file');
      expect(r1![2]).toEqual(['pdf']);
      const r2 = router.match('GET', '/file.jpg');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('get-file');
      expect(r2![2]).toEqual(['jpg']);
    });

    it('should match param with static suffix', () => {
      router.add('GET', '/image-:id.png', 'get-image');
      const result = router.match('GET', '/image-42.png');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('get-image');
      expect(params).toEqual(['42']);
      expect(router.match('GET', '/image-42.jpg')).toBeNull();
    });
  });

  describe('Optional Parameters', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match with and without optional param', () => {
      router.add('GET', '/items/:id?', 'get-items');
      const r1 = router.match('GET', '/items');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('get-items');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/items/123');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('get-items');
      expect(r2![2]).toEqual(['123']);
    });
  });

  describe('Wildcard Routes', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match wildcard routes', () => {
      router.add('GET', '/files/*', 'serve-file');
      const r1 = router.match('GET', '/files/docs/readme.md');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('serve-file');
      expect(r1![2]).toEqual(['docs/readme.md']);
      const r2 = router.match('GET', '/files/a/b/c/d.txt');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('serve-file');
      expect(r2![2]).toEqual(['a/b/c/d.txt']);
    });
  });

  describe('Double Colon Escape', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should handle double colon as single colon', () => {
      router.add('GET', '/name::customVerb', 'custom');
      const result = router.match('GET', '/name:customVerb');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('custom');
      expect(params).toEqual([':customVerb']);
    });
  });

  describe('Route Priority', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should prioritize static over parametric', () => {
      router.add('GET', '/users/:id', 'param');
      router.add('GET', '/users/me', 'static');
      const r1 = router.match('GET', '/users/me');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('static');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/users/123');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('param');
      expect(r2![2]).toEqual(['123']);
    });

    it('should prioritize parametric over wildcard', () => {
      router.add('GET', '/files/*', 'wildcard');
      router.add('GET', '/files/:id', 'param');
      const r1 = router.match('GET', '/files/123');
      expect(r1).not.toBeNull();
      expect(r1![0]).toBe('param');
      expect(r1![2]).toEqual(['123']);
      const r2 = router.match('GET', '/files/a/b/c');
      expect(r2).not.toBeNull();
      expect(r2![0]).toBe('wildcard');
      expect(r2![2]).toEqual(['a/b/c']);
    });
  });

  describe('HTTP Methods', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should handle different HTTP methods', () => {
      router.add('GET', '/users', 'get');
      router.add('POST', '/users', 'post');
      router.add('PUT', '/users', 'put');
      router.add('DELETE', '/users', 'delete');
      expect(router.match('GET', '/users')![0]).toBe('get');
      expect(router.match('POST', '/users')![0]).toBe('post');
      expect(router.match('PUT', '/users')![0]).toBe('put');
      expect(router.match('DELETE', '/users')![0]).toBe('delete');
    });
  });

  describe('Edge Cases', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should handle root path', () => {
      router.add('GET', '/', 'root');
      const result = router.match('GET', '/');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('root');
      expect(params).toEqual([]);
    });

    it('should handle empty params', () => {
      router.add('GET', '/users', 'handler');
      const result = router.match('GET', '/users');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('handler');
      expect(params).toEqual([]);
    });

    it('should handle special characters in params', () => {
      router.add('GET', '/users/:id', 'handler');
      const result = router.match('GET', '/users/user-123');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('handler');
      expect(params).toEqual(['user-123']);
    });
  });

  describe('ALL Method Support', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match ALL for any method', () => {
      router.add('ALL', '/api', 'all-handler');
      const getRes = router.match('GET', '/api');
      expect(getRes).not.toBeNull();
      expect(getRes![0]).toBe('all-handler');
      const postRes = router.match('POST', '/api');
      expect(postRes).not.toBeNull();
      expect(postRes![0]).toBe('all-handler');
      const putRes = router.match('PUT', '/api');
      expect(putRes).not.toBeNull();
      expect(putRes![0]).toBe('all-handler');
    });

    it('should prefer specific method over ALL', () => {
      router.add('ALL', '/api', 'all-handler');
      router.add('GET', '/api', 'get-handler');
      const getRes = router.match('GET', '/api');
      expect(getRes).not.toBeNull();
      expect(getRes![0]).toBe('get-handler');
      const postRes = router.match('POST', '/api');
      expect(postRes).not.toBeNull();
      expect(postRes![0]).toBe('all-handler');
    });

    it('should work with ALL and parametric routes', () => {
      router.add('ALL', '/users/:id', 'all-user');
      const result = router.match('DELETE', '/users/123');
      expect(result).not.toBeNull();
      const [handler, , params] = result!;
      expect(handler).toBe('all-user');
      expect(params).toEqual(['123']);
    });
  });
});
