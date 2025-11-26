import { createCache } from '../cache/cache';

// If the Cache type is exported, you can optionally import it as well
// import type { Cache } from '../cache/cache';

describe('Cache', () => {
  let cache: any; // Use Cache instead of any if the type is available

  afterEach(() => {
    // Clean up the interval after each test
    if (cache && typeof cache.destroy === 'function') {
      cache.destroy();
      cache = undefined;
    }
  });

  it('should store and retrieve values', () => {
    cache = createCache();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    cache = createCache();
    expect(cache.get('missing')).toBeNull();
  });

  it('should expire values after TTL', (done) => {
    cache = createCache({ defaultTTL: 50 });
    cache.set('key1', 'value1');

    setTimeout(() => {
      expect(cache.get('key1')).toBeNull();
      done();
    }, 100);
  });

  it('should evict LRU when at capacity', () => {
    cache = createCache({ maxEntries: 2 });
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.get('key1'); // Access key1
    cache.set('key3', 'value3'); // Should evict key2

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBe('value3');
  });

  it('should track stats', () => {
    cache = createCache();
    
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('missing');

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.entries).toBe(1);
  });

  it('should clear all entries', () => {
    cache = createCache();
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();

    expect(cache.size()).toBe(0);
  });

  it('should cleanup on destroy', () => {
    cache = createCache();
    cache.set('key1', 'value1');
    cache.destroy();

    // prevent double-destroy in afterEach
    const destroyedCache = cache;
    cache = undefined;

    expect(destroyedCache.get('key1')).toBeNull();
  });
});