import { useSyncExternalStore, useCallback, useRef, useEffect } from 'react';
import type { Store } from './store';
import { shallowEqual } from '../utils/equality';

export function useStore<T>(store: Store<T>): T;
export function useStore<T, R>(
  store: Store<T>,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): R;

export function useStore<T, R = T>(
  store: Store<T>,
  selector?: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R | T {
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);

  // Update refs without causing re-render
  useEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return store.subscribe(onStoreChange);
    },
    [store]
  );

  const getSnapshot = useCallback(() => {
    const currentSelector = selectorRef.current;
    return currentSelector 
      ? store.select(currentSelector, equalityFnRef.current)
      : store.getState();
  }, [store]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as R | T;
}

// Optimized selector hook with built-in memoization
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = shallowEqual
): R {
  return useStore(store, selector, equalityFn);
}
