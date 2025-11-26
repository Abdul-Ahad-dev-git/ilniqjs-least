import { createStore, type Store, type StoreConfig } from './store';
import { safeStorage } from '../utils/env';
import { throttle } from '../utils/timing';

export interface PersistConfig<T> {
  key: string;
  storage?: Storage;
  throttleMs?: number;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
}

export function createPersistedStore<T extends object>(
  storeConfig: StoreConfig<T>,
  persistConfig: PersistConfig<T>
): Store<T> {
  const {
    key,
    storage = safeStorage(),
    throttleMs = 1000,
    version = 1,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = persistConfig;

  // Load persisted state
  let initialState = storeConfig.initialState;
  try {
    const stored = storage.getItem(key);
    if (stored) {
      const parsed = deserialize(stored);
      const persistedVersion = parsed.__version || 0;

      if (migrate && persistedVersion !== version) {
        initialState = migrate(parsed, persistedVersion);
      } else {
        const { __version, ...state } = parsed;
        initialState = { ...initialState, ...state };
      }
    }
  } catch (error) {
    console.error('[Persist] Failed to load state:', error);
  }

  const store = createStore({ ...storeConfig, initialState });

  // Throttled save function
  const saveState = throttle((state: T) => {
    try {
      const toStore = { ...state, __version: version };
      storage.setItem(key, serialize(toStore as any));
    } catch (error) {
      console.error('[Persist] Failed to save state:', error);
    }
  }, throttleMs);

  // Subscribe to changes
  const unsubscribe = store.subscribe((state) => {
    saveState(state);
  });

  // Cleanup on destroy
  const originalDestroy = store.destroy.bind(store);
  store.destroy = () => {
    unsubscribe();
    originalDestroy();
  };

  return store;
}