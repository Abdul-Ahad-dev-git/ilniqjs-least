import { scheduleBatch } from './batch';
import { shallowEqual } from '../utils/equality';

type Listener<T> = (state: T, prevState: T) => void;
type Selector<T, R> = (state: T) => R;
type Unsubscribe = () => void;
type StateUpdater<T> = Partial<T> | ((prev: T) => T | Partial<T>);

export interface StoreConfig<T> {
  initialState: T;
  name?: string;
  equalityFn?: (a: T, b: T) => boolean;
}

export interface Store<T> {
  getState(): T;
  setState(updater: StateUpdater<T>): void;
  subscribe(listener: Listener<T>): Unsubscribe;
  select<R>(selector: Selector<T, R>, equalityFn?: (a: R, b: R) => boolean): R;
  destroy(): void;
  getListenerCount(): number;
}

// LRU Cache for selectors
class SelectorCache<T> {
  private cache = new Map<Selector<T, any>, { value: any; stateVersion: number }>();
  private maxSize: number;
  private stateVersion = 0;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get<R>(selector: Selector<T, R>): { value: R; stateVersion: number } | undefined {
    const cached = this.cache.get(selector);
    if (cached) {
      // Move to end (LRU)
      this.cache.delete(selector);
      this.cache.set(selector, cached);
    }
    return cached;
  }

  set<R>(selector: Selector<T, R>, value: R): void {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(selector, { value, stateVersion: this.stateVersion });
  }

  invalidate(): void {
    this.stateVersion++;
    this.cache.clear();
  }

  clear(): void {
    this.cache.clear();
  }
}

export function createStore<T extends object>(config: StoreConfig<T>): Store<T> {
  let state = config.initialState;
  let isDestroyed = false;
  const listeners = new Set<Listener<T>>();
  const selectorCache = new SelectorCache<T>(50);
  const equalityFn = config.equalityFn || shallowEqual;
  
  // Track if we have a pending notification to avoid duplicates
  let hasPendingNotification = false;
  let notificationPrevState: T | null = null;

  function notifyListeners(prevState: T, nextState: T): void {
    listeners.forEach(listener => {
      try {
        listener(nextState, prevState);
      } catch (error) {
        console.error(`[Store:${config.name || 'unnamed'}] Listener error:`, error);
      }
    });
  }

  function notify(prevState: T): void {
    if (isDestroyed) return;
    
    // If we don't have a pending notification, schedule one
    if (!hasPendingNotification) {
      hasPendingNotification = true;
      notificationPrevState = prevState;
      
      scheduleBatch(() => {
        hasPendingNotification = false;
        // Use the original prevState from when batching started
        notifyListeners(notificationPrevState!, state);
        notificationPrevState = null;
      });
    }
    // If we already have a pending notification, it will use the latest state
    // when it executes, so we don't need to schedule another one
  }

  return {
    getState() {
      if (isDestroyed) {
        throw new Error(`[Store:${config.name}] Cannot getState on destroyed store`);
      }
      return state;
    },

    setState(updater: StateUpdater<T>) {
      if (isDestroyed) {
        console.warn(`[Store:${config.name}] Cannot setState on destroyed store`);
        return;
      }

      const prevState = state;
      let nextState: T;

      if (typeof updater === 'function') {
        const result = updater(state);
        nextState = typeof result === 'object' && result !== null
          ? { ...state, ...result }
          : result as T;
      } else {
        nextState = { ...state, ...updater };
      }

      // Skip if no change
      if (equalityFn(prevState, nextState)) {
        return;
      }

      state = nextState;
      selectorCache.invalidate();
      
      // Only capture the FIRST prevState in a batch
      if (!hasPendingNotification) {
        notify(prevState);
      }
    },

    subscribe(listener: Listener<T>): Unsubscribe {
      if (isDestroyed) {
        throw new Error(`[Store:${config.name}] Cannot subscribe to destroyed store`);
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    select<R>(selector: Selector<T, R>): R {
      if (isDestroyed) {
        throw new Error(`[Store:${config.name}] Cannot select on destroyed store`);
      }

      const cached = selectorCache.get(selector);
      if (cached) {
        return cached.value;
      }

      const result = selector(state);
      selectorCache.set(selector, result);
      return result;
    },

    destroy() {
      if (isDestroyed) return;
      
      isDestroyed = true;
      listeners.clear();
      selectorCache.clear();
    },

    getListenerCount(): number {
      return listeners.size;
    }
  };
}