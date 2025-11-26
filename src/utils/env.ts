export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isServer = !isBrowser;

export function safeStorage(): Storage {
  if (!isBrowser) {
    return {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {}
    };
  }
  return window.localStorage;
}

export function safeSessionStorage(): Storage {
  if (!isBrowser) {
    return safeStorage();
  }
  return window.sessionStorage;
}