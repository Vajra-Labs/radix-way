import {RadixTree} from '../src/index';
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
      expect(r1![0][0]).toBe('list-users');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/posts');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('list-posts');
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
      const [handlers, paramMap, params] = result!;
      expect(handlers[0]).toBe('get-user');
      expect(paramMap).toEqual({id: 0});
      expect(params).toEqual(['123']);
    });

    it('should match multiple parameters', () => {
      router.add('GET', '/users/:userId/posts/:postId', 'get-post');
      const result = router.match('GET', '/users/42/posts/99');
      expect(result).not.toBeNull();
      const [handlers, paramMap, params] = result!;
      expect(handlers[0]).toBe('get-post');
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
      router.add('GET', '/posts/:id{\\d+}', 'get-post-by-id');
      const result = router.match('GET', '/posts/123');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('get-post-by-id');
      expect(params).toEqual(['123']);
      expect(router.match('GET', '/posts/abc')).toBeNull();
    });

    it('should match different regex patterns', () => {
      router.add('GET', '/posts/:id{\\d+}', 'numeric');
      router.add('GET', '/posts/:slug{[a-z-]+}', 'slug');
      const r1 = router.match('GET', '/posts/123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('numeric');
      expect(r1![2]).toEqual(['123']);
      const r2 = router.match('GET', '/posts/my-post');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('slug');
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
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('get-time');
      expect(params).toEqual(['14', '30']);
    });

    it('should match multi-parameters with dot', () => {
      router.add('GET', '/file.:name.:ext', 'get-file');
      const result = router.match('GET', '/file.readme.md');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('get-file');
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
      expect(r1![0][0]).toBe('get-file');
      expect(r1![2]).toEqual(['pdf']);
      const r2 = router.match('GET', '/file.jpg');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('get-file');
      expect(r2![2]).toEqual(['jpg']);
    });

    it('should match param with static suffix', () => {
      router.add('GET', '/image-:id.png', 'get-image');
      const result = router.match('GET', '/image-42.png');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('get-image');
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
      expect(r1![0][0]).toBe('get-items');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/items/123');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('get-items');
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
      expect(r1![0][0]).toBe('serve-file');
      expect(r1![2]).toEqual(['docs/readme.md']);
      const r2 = router.match('GET', '/files/a/b/c/d.txt');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('serve-file');
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
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('custom');
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
      expect(r1![0][0]).toBe('static');
      expect(r1![2]).toEqual([]);
      const r2 = router.match('GET', '/users/123');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('param');
      expect(r2![2]).toEqual(['123']);
    });

    it('should prioritize parametric over wildcard', () => {
      router.add('GET', '/files/*', 'wildcard');
      router.add('GET', '/files/:id', 'param');
      const r1 = router.match('GET', '/files/123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('param');
      expect(r1![2]).toEqual(['123']);
      const r2 = router.match('GET', '/files/a/b/c');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('wildcard');
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
      expect(router.match('GET', '/users')![0][0]).toBe('get');
      expect(router.match('POST', '/users')![0][0]).toBe('post');
      expect(router.match('PUT', '/users')![0][0]).toBe('put');
      expect(router.match('DELETE', '/users')![0][0]).toBe('delete');
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
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('root');
      expect(params).toEqual([]);
    });

    it('should handle empty params', () => {
      router.add('GET', '/users', 'handler');
      const result = router.match('GET', '/users');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('handler');
      expect(params).toEqual([]);
    });

    it('should handle special characters in params', () => {
      router.add('GET', '/users/:id', 'handler');
      const result = router.match('GET', '/users/user-123');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('handler');
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
      expect(getRes![0][0]).toBe('all-handler');
      const postRes = router.match('POST', '/api');
      expect(postRes).not.toBeNull();
      expect(postRes![0][0]).toBe('all-handler');
      const putRes = router.match('PUT', '/api');
      expect(putRes).not.toBeNull();
      expect(putRes![0][0]).toBe('all-handler');
    });

    it('should prefer specific method over ALL', () => {
      router.add('ALL', '/api', 'all-handler');
      router.add('GET', '/api', 'get-handler');
      const getRes = router.match('GET', '/api');
      expect(getRes).not.toBeNull();
      expect(getRes![0][0]).toBe('get-handler');
      const postRes = router.match('POST', '/api');
      expect(postRes).not.toBeNull();
      expect(postRes![0][0]).toBe('all-handler');
    });

    it('should work with ALL and parametric routes', () => {
      router.add('ALL', '/users/:id', 'all-user');
      const result = router.match('DELETE', '/users/123');
      expect(result).not.toBeNull();
      const [handlers, , params] = result!;
      expect(handlers[0]).toBe('all-user');
      expect(params).toEqual(['123']);
    });
  });

  describe('Complex Routing Patterns', () => {
    let router: RadixTree<string>;

    beforeEach(() => {
      router = new RadixTree();
    });

    it('should match multiple regex params in single route', () => {
      router.add(
        'GET',
        '/users/:userId{\\d+}/posts/:postId{[a-f0-9]+}',
        'user-post',
      );
      const r1 = router.match('GET', '/users/123/posts/abc123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('user-post');
      expect(r1![2]).toEqual(['123', 'abc123']);

      const r2 = router.match('GET', '/users/999/posts/deadbeef');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['999', 'deadbeef']);

      // Should fail - userId not numeric
      expect(router.match('GET', '/users/abc/posts/123')).toBeNull();

      // Should fail - postId has invalid chars
      expect(router.match('GET', '/users/123/posts/xyz')).toBeNull();
    });

    it('should match regex with static suffix combination', () => {
      router.add(
        'GET',
        '/api/v:version{\\d+}/users/:id{[0-9a-f]{8}}',
        'versioned-api',
      );
      const r1 = router.match('GET', '/api/v1/users/12345678');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('versioned-api');
      expect(r1![2]).toEqual(['1', '12345678']);

      const r2 = router.match('GET', '/api/v99/users/abcdef01');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['99', 'abcdef01']);

      // Should fail - id too short
      expect(router.match('GET', '/api/v1/users/123')).toBeNull();
    });

    it('should match date pattern with multiple separators', () => {
      router.add(
        'GET',
        '/time/:year{\\d{4}}-:month{\\d{2}}-:day{\\d{2}}',
        'date',
      );
      const r1 = router.match('GET', '/time/2024-12-25');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('date');
      expect(r1![2]).toEqual(['2024', '12', '25']);

      const r2 = router.match('GET', '/time/1999-01-01');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['1999', '01', '01']);

      // Should fail - year too short
      expect(router.match('GET', '/time/24-12-25')).toBeNull();
    });

    it('should match slug pattern with hyphens', () => {
      router.add('GET', '/blog/:slug{[a-z0-9]+(?:-[a-z0-9]+)*}', 'blog-post');
      const r1 = router.match('GET', '/blog/hello-world');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('blog-post');
      expect(r1![2]).toEqual(['hello-world']);

      const r2 = router.match('GET', '/blog/my-post-123');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['my-post-123']);

      // Should fail - uppercase not allowed
      expect(router.match('GET', '/blog/Hello-World')).toBeNull();
    });

    it('should match file extension with alternation', () => {
      router.add(
        'GET',
        '/files/:name{[a-zA-Z0-9_-]+}.:ext{json|xml|txt}',
        'file-handler',
      );
      const r1 = router.match('GET', '/files/config.json');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('file-handler');
      expect(r1![2]).toEqual(['config', 'json']);

      const r2 = router.match('GET', '/files/data-file.xml');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['data-file', 'xml']);

      const r3 = router.match('GET', '/files/readme.txt');
      expect(r3).not.toBeNull();
      expect(r3![2]).toEqual(['readme', 'txt']);

      // Should fail - pdf not in alternation
      expect(router.match('GET', '/files/file.pdf')).toBeNull();
    });

    it('should match UUID pattern', () => {
      router.add(
        'GET',
        '/resources/:uuid{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
        'uuid-resource',
      );
      const r1 = router.match(
        'GET',
        '/resources/550e8400-e29b-41d4-a716-446655440000',
      );
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('uuid-resource');
      expect(r1![2]).toEqual(['550e8400-e29b-41d4-a716-446655440000']);

      // Should fail - invalid format
      expect(router.match('GET', '/resources/invalid-uuid')).toBeNull();
    });

    it('should match IP address pattern', () => {
      router.add('GET', '/server/:ip{(?:\\d{1,3}\\.){3}\\d{1,3}}', 'server-ip');
      const r1 = router.match('GET', '/server/192.168.1.1');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('server-ip');
      expect(r1![2]).toEqual(['192.168.1.1']);

      const r2 = router.match('GET', '/server/10.0.0.1');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['10.0.0.1']);

      // Should fail - not IP format
      expect(router.match('GET', '/server/not-ip')).toBeNull();
    });

    it('should prioritize regex over simple param', () => {
      router.add('GET', '/mixed/:id', 'simple-param');
      router.add('GET', '/mixed/:id{\\d+}', 'regex-param');

      const r1 = router.match('GET', '/mixed/123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('regex-param');
      expect(r1![2]).toEqual(['123']);

      const r2 = router.match('GET', '/mixed/abc');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('simple-param');
      expect(r2![2]).toEqual(['abc']);
    });

    it('should handle backtracking with complex patterns', () => {
      router.add('GET', '/bt/:a{\\d+}-:b{\\d+}', 'two-numbers');
      router.add('GET', '/bt/:text', 'simple-text');

      const r1 = router.match('GET', '/bt/12-34');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('two-numbers');
      expect(r1![2]).toEqual(['12', '34']);

      const r2 = router.match('GET', '/bt/hello');
      expect(r2).not.toBeNull();
      expect(r2![0][0]).toBe('simple-text');
      expect(r2![2]).toEqual(['hello']);

      const r3 = router.match('GET', '/bt/12-abc');
      expect(r3).not.toBeNull();
      expect(r3![0][0]).toBe('simple-text');
      expect(r3![2]).toEqual(['12-abc']);
    });

    it('should match email pattern', () => {
      router.add(
        'GET',
        '/user/:email{[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}}',
        'user-email',
      );
      const r1 = router.match('GET', '/user/test@example.com');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('user-email');
      expect(r1![2]).toEqual(['test@example.com']);

      const r2 = router.match('GET', '/user/john.doe+tag@company.co.uk');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['john.doe+tag@company.co.uk']);

      // Should fail - no @ symbol
      expect(router.match('GET', '/user/invalid-email')).toBeNull();
    });

    it('should match hex color pattern', () => {
      router.add('GET', '/color/:hex{#[0-9a-fA-F]{6}}', 'hex-color');
      const r1 = router.match('GET', '/color/#FF5733');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('hex-color');
      expect(r1![2]).toEqual(['#FF5733']);

      const r2 = router.match('GET', '/color/#000000');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['#000000']);

      // Should fail - invalid hex chars
      expect(router.match('GET', '/color/#GGGGGG')).toBeNull();
    });

    it('should match semantic version pattern', () => {
      router.add('GET', '/package/:version{\\d+\\.\\d+\\.\\d+}', 'semver');
      const r1 = router.match('GET', '/package/1.2.3');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('semver');
      expect(r1![2]).toEqual(['1.2.3']);

      const r2 = router.match('GET', '/package/10.20.30');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['10.20.30']);

      // Should fail - missing patch version
      expect(router.match('GET', '/package/1.2')).toBeNull();
    });

    it('should handle deeply nested static paths', () => {
      router.add('GET', '/a/b/c/d/e/f/:id{\\d+}', 'deep-nested');
      const r1 = router.match('GET', '/a/b/c/d/e/f/123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('deep-nested');
      expect(r1![2]).toEqual(['123']);

      // Should fail - not numeric
      expect(router.match('GET', '/a/b/c/d/e/f/abc')).toBeNull();
    });

    it('should match domain-like pattern with dots', () => {
      router.add('GET', '/proxy/:subdomain.:domain.:tld', 'proxy');
      const r1 = router.match('GET', '/proxy/www.example.com');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('proxy');
      expect(r1![2]).toEqual(['www', 'example', 'com']);

      const r2 = router.match('GET', '/proxy/api.github.io');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['api', 'github', 'io']);
    });

    it('should handle complex alternation patterns', () => {
      router.add(
        'GET',
        '/media/:type{image|video|audio}/:id{\\d+}',
        'media-handler',
      );
      const r1 = router.match('GET', '/media/image/123');
      expect(r1).not.toBeNull();
      expect(r1![0][0]).toBe('media-handler');
      expect(r1![2]).toEqual(['image', '123']);

      const r2 = router.match('GET', '/media/video/456');
      expect(r2).not.toBeNull();
      expect(r2![2]).toEqual(['video', '456']);

      const r3 = router.match('GET', '/media/audio/789');
      expect(r3).not.toBeNull();
      expect(r3![2]).toEqual(['audio', '789']);

      // Should fail - invalid type
      expect(router.match('GET', '/media/document/123')).toBeNull();
    });
  });
});
