interface CacheEntry<T> {
  value: T;
  expiry: number;
  hits: number;
  size: number;
}

export interface CacheOptions {
  defaultTTL?: number;
  maxSize?: number;
  maxEntries?: number;
  onEvict?: (key: string, value: any) => void;
}

export interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
  keys(): string[];
  getStats(): CacheStats;
  destroy(): void;
}

export interface CacheStats {
  entries: number;
  size: number;
  hits: number;
  misses: number;
  evictions: number;
}

export function createCache(options: CacheOptions = {}): Cache {
  const {
    defaultTTL = 300000, // 5 minutes
    maxSize = 10 * 1024 * 1024, // 10MB
    maxEntries = 100,
    onEvict
  } = options;

  const cache = new Map<string, CacheEntry<any>>();
  let totalSize = 0;
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let isDestroyed = false;
  let cleanupInterval: any;

  function estimateSize(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 0;
  }

  function evictLRU(): void {
    if (cache.size === 0) return;

    // Find least recently used (lowest hits)
    let minHits = Infinity;
    let lruKey: string | null = null;

    for (const [key, entry] of cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = cache.get(lruKey);
      cache.delete(lruKey);
      if (entry) {
        totalSize -= entry.size;
        evictions++;
        onEvict?.(lruKey, entry.value);
      }
    }
  }

  function cleanup(): void {
    if (isDestroyed) return;

    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      const entry = cache.get(key);
      if (entry) {
        cache.delete(key);
        totalSize -= entry.size;
        evictions++;
        onEvict?.(key, entry.value);
      }
    });
  }

  // Start cleanup interval
  cleanupInterval = setInterval(cleanup, 60000);

  return {
    get<T>(key: string): T | null {
      if (isDestroyed) return null;

      const entry = cache.get(key);
      if (!entry) {
        misses++;
        return null;
      }

      if (Date.now() > entry.expiry) {
        cache.delete(key);
        totalSize -= entry.size;
        misses++;
        return null;
      }

      entry.hits++;
      hits++;
      return entry.value;
    },

    set<T>(key: string, value: T, ttl = defaultTTL): void {
      if (isDestroyed) return;

      const size = estimateSize(value);

      // Check size limit
      while (totalSize + size > maxSize && cache.size > 0) {
        evictLRU();
      }

      // Check entries limit
      while (cache.size >= maxEntries) {
        evictLRU();
      }

      // Remove old entry if exists
      const existing = cache.get(key);
      if (existing) {
        totalSize -= existing.size;
      }

      cache.set(key, {
        value,
        expiry: Date.now() + ttl,
        hits: 0,
        size
      });

      totalSize += size;
    },

    has(key: string): boolean {
      if (isDestroyed) return false;

      const entry = cache.get(key);
      if (!entry) return false;

      if (Date.now() > entry.expiry) {
        cache.delete(key);
        totalSize -= entry.size;
        return false;
      }

      return true;
    },

    delete(key: string): boolean {
      if (isDestroyed) return false;

      const entry = cache.get(key);
      if (!entry) return false;

      cache.delete(key);
      totalSize -= entry.size;
      onEvict?.(key, entry.value);
      return true;
    },

    clear(): void {
      if (isDestroyed) return;

      cache.forEach((entry, key) => {
        onEvict?.(key, entry.value);
      });

      cache.clear();
      totalSize = 0;
      hits = 0;
      misses = 0;
      evictions = 0;
    },

    size(): number {
      return cache.size;
    },

    keys(): string[] {
      return Array.from(cache.keys());
    },

    getStats(): CacheStats {
      return {
        entries: cache.size,
        size: totalSize,
        hits,
        misses,
        evictions
      };
    },

    destroy(): void {
      if (isDestroyed) return;

      isDestroyed = true;
      clearInterval(cleanupInterval);
      this.clear();
    }
  };
}