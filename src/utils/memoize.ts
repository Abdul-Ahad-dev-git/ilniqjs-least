export interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T & { clear: () => void; cache: Map<string, any> } {
  const {
    maxSize = 50,
    ttl = 300000,
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;

  const cache = new Map<string, { value: any; expiry: number }>();

  const memoized = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    const result = fn.apply(this, args);

    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, {
      value: result,
      expiry: Date.now() + ttl
    });

    return result;
  } as T & { clear: () => void; cache: Map<string, any> };

  memoized.clear = () => {
    cache.clear();
  };

  memoized.cache = cache;

  return memoized;
}