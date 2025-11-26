import { createStore } from '../state/store';
import { batch } from '../state/batch';

describe('Store', () => {
  it('should create store with initial state', () => {
    const store = createStore({ initialState: { count: 0 } });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state', () => {
    const store = createStore({ initialState: { count: 0 } });
    store.setState({ count: 1 });
    expect(store.getState().count).toBe(1);
  });

  it('should update state with function', () => {
    const store = createStore({ initialState: { count: 0 } });
    store.setState(prev => ({ count: prev.count + 1 }));
    expect(store.getState().count).toBe(1);
  });

  it('should skip update if state unchanged', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    store.subscribe(listener);
    
    store.setState({ count: 0 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should notify listeners', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    
    store.subscribe(listener);
    store.setState({ count: 1 });
    
    expect(listener).toHaveBeenCalledWith(
      { count: 1 },
      { count: 0 }
    );
  });

  it('should unsubscribe', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState({ count: 1 });
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should select value', () => {
    const store = createStore({ initialState: { count: 0, name: 'test' } });
    const count = store.select(s => s.count);
    expect(count).toBe(0);
  });

  it('should cache selectors', () => {
    const store = createStore({ initialState: { count: 0 } });
    const selector = jest.fn(s => s.count);
    
    store.select(selector);
    store.select(selector);
    
    expect(selector).toHaveBeenCalledTimes(1);
  });

  it('should batch updates', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    
    store.subscribe(listener);
    
    batch(() => {
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });
    });
    
    // Should have batched into a single call
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 3 }, { count: 0 });
    expect(store.getState().count).toBe(3);
  });

  it('should handle destroy', () => {
    const store = createStore({ initialState: { count: 0 } });
    store.destroy();
    
    expect(() => store.getState()).toThrow();
  });

  it('should track listener count', () => {
    const store = createStore({ initialState: { count: 0 } });
    
    const unsub1 = store.subscribe(() => {});
    const unsub2 = store.subscribe(() => {});
    
    expect(store.getListenerCount()).toBe(2);
    
    unsub1();
    expect(store.getListenerCount()).toBe(1);
  });
});

describe('Batch', () => {
  it('should batch synchronous updates', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    store.subscribe(listener);
    
    batch(() => {
      store.setState({ count: 1 });
      store.setState({ count: 2 });
    });
    
    // Should have batched the updates
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 2 }, { count: 0 });
    expect(store.getState().count).toBe(2);
  });

  it('should handle nested batches', () => {
    const store = createStore({ initialState: { count: 0 } });
    const listener = jest.fn();
    store.subscribe(listener);
    
    batch(() => {
      store.setState({ count: 1 });
      batch(() => {
        store.setState({ count: 2 });
      });
      store.setState({ count: 3 });
    });
    
    // Should have batched all updates
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 3 }, { count: 0 });
    expect(store.getState().count).toBe(3);
  });
});