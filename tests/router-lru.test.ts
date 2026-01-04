import {lru} from 'tiny-lru';
import {RadixTree} from '../src/index';
import {describe, it, expect} from 'vitest';

describe('RadixTree – LRU Cache', () => {
  it('should cache static route matches', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.add('GET', '/users', 'handler');

    // First call – cache miss
    const r1 = router.match('GET', '/users');
    expect(r1).not.toBeNull();
    expect(r1![0][0]).toBe('handler');
    expect(cache.size).toBe(1);

    // Second call – cache hit
    const r2 = router.match('GET', '/users');
    expect(r2).toBe(r1); // same reference proves cache usage
  });

  it('should cache dynamic route matches', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.add('GET', '/users/:id', 'user-handler');

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

    router.add('GET', '/api', 'get-handler');
    router.add('POST', '/api', 'post-handler');

    const getRes = router.match('GET', '/api');
    const postRes = router.match('POST', '/api');

    expect(getRes![0][0]).toBe('get-handler');
    expect(postRes![0][0]).toBe('post-handler');

    // Only one cache entry per path
    expect(cache.size).toBe(1);

    // Cached handlers object reused
    expect(router.match('GET', '/api')).toBe(getRes);
    expect(router.match('POST', '/api')).toBe(postRes);
  });

  it('should evict least recently used entries', () => {
    const cache = lru<any>(2);
    const router = new RadixTree<string>(cache);

    router.add('GET', '/a', 'a');
    router.add('GET', '/b', 'b');
    router.add('GET', '/c', 'c');

    router.match('GET', '/a'); // cache: a
    router.match('GET', '/b'); // cache: a, b
    router.match('GET', '/c'); // cache: b, c (a evicted)

    expect(cache.size).toBe(2);
    expect(cache.get('/a')).toBeUndefined();
    expect(cache.get('/b')).toBeDefined();
    expect(cache.get('/c')).toBeDefined();
  });

  it('should cache ALL-method resolution', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.add('ALL', '/health', 'health');

    const r1 = router.match('GET', '/health');
    const r2 = router.match('POST', '/health');

    expect(r1![0][0]).toBe('health');
    expect(r2![0][0]).toBe('health');

    // Single cache entry for path
    expect(cache.size).toBe(1);
  });

  it('should prefer method over ALL even when cached', () => {
    const cache = lru<any>(10);
    const router = new RadixTree<string>(cache);

    router.add('ALL', '/api', 'all');
    router.add('GET', '/api', 'get');

    const getRes = router.match('GET', '/api');
    expect(getRes![0][0]).toBe('get');

    const postRes = router.match('POST', '/api');
    expect(postRes![0][0]).toBe('all');

    // Cached result reused correctly
    expect(router.match('GET', '/api')).toBe(getRes);
    expect(router.match('POST', '/api')).toBe(postRes);
  });
});
