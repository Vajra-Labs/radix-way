import {lru} from 'tiny-lru';
import {RadixTree} from '../src/index';
import {describe, it, expect} from 'vitest';

describe('RadixTree – LRU Cache', () => {
  it('should NOT cache static routes (optimization)', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.insert('GET', '/users', 'handler');

    // Static routes bypass cache for performance
    const r1 = router.match('GET', '/users');
    expect(r1).not.toBeNull();
    expect(r1![0][0]).toBe('handler');
    expect(cache.size).toBe(0); // Not cached

    // Second call also bypasses cache (direct Map lookup)
    const r2 = router.match('GET', '/users');
    expect(r2).not.toBeNull();
    expect(cache.size).toBe(0);
  });

  it('should cache dynamic route matches', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.insert('GET', '/users/:id', 'user-handler');

    const r1 = router.match('GET', '/users/123');
    expect(r1).not.toBeNull();
    expect(r1![2]).toEqual(['123']);
    expect(cache.size).toBe(1);

    const r2 = router.match('GET', '/users/123');
    expect(r2).toBe(r1);
  });

  it('should respect HTTP methods when using cache', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.insert('GET', '/api/:id', 'get-handler');
    router.insert('POST', '/api/:id', 'post-handler');

    const getRes = router.match('GET', '/api/123');
    const postRes = router.match('POST', '/api/456');

    expect(getRes![0][0]).toBe('get-handler');
    expect(postRes![0][0]).toBe('post-handler');

    // Two cache entries (one per path)
    expect(cache.size).toBe(2);

    // Cached handlers object reused
    expect(router.match('GET', '/api/123')).toBe(getRes);
    expect(router.match('POST', '/api/456')).toBe(postRes);
  });

  it('should evict least recently used entries', () => {
    const cache = lru<any>(2);
    const router = new RadixTree<string>(cache);

    router.insert('GET', '/users/:id', 'handler');

    router.match('GET', '/users/1'); // cache: /users/1
    router.match('GET', '/users/2'); // cache: /users/1, /users/2
    router.match('GET', '/users/3'); // cache: /users/2, /users/3 (/users/1 evicted)

    expect(cache.size).toBe(2);
    expect(cache.get('/users/1')).toBeUndefined();
    expect(cache.get('/users/2')).toBeDefined();
    expect(cache.get('/users/3')).toBeDefined();
  });

  it('should cache ALL-method resolution', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.insert('ALL', '/health/:check', 'health');

    const r1 = router.match('GET', '/health/ping');
    const r2 = router.match('POST', '/health/pong');

    expect(r1![0][0]).toBe('health');
    expect(r2![0][0]).toBe('health');

    // Two cache entries (one per path)
    expect(cache.size).toBe(2);
  });

  it('should prefer method over ALL even when cached', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.insert('ALL', '/api/:version', 'all');
    router.insert('GET', '/api/:version', 'get');

    const getRes = router.match('GET', '/api/v1');
    expect(getRes![0][0]).toBe('get');

    const postRes = router.match('POST', '/api/v2');
    expect(postRes![0][0]).toBe('all');

    // Cached result reused correctly
    expect(router.match('GET', '/api/v1')).toBe(getRes);
    expect(router.match('POST', '/api/v2')).toBe(postRes);
  });
});
