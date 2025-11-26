import type { Store } from './store';

interface DevToolsExtension {
  connect(options: { name: string }): any;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: DevToolsExtension;
  }
}

export function connectDevTools<T>(
  store: Store<T>,
  name: string = 'Store'
): (() => void) | undefined {
  if (
    typeof window === 'undefined' ||
    !window.__REDUX_DEVTOOLS_EXTENSION__
  ) {
    return undefined;
  }

  try {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
    devTools.init(store.getState());
const unsubscribe = store.subscribe((state) => {
      devTools.send(
        {
          type: 'setState',
          payload: state
        },
        state
      );
    });

    return () => {
      unsubscribe();
      devTools.disconnect?.();
    };
  } catch (error) {
    console.error('[DevTools] Connection failed:', error);
    return undefined;
  }
}