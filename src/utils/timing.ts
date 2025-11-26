export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: any;

  const debounced = function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let lastRan = 0;
  let timeoutId: any;

  const throttled = function(this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRan >= limit) {
      fn.apply(this, args);
      lastRan = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastRan = Date.now();
      }, limit - (now - lastRan));
    }
  };

  throttled.cancel = () => {
    clearTimeout(timeoutId);
  };

  return throttled;
}