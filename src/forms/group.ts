import type { FormControl } from './control';

type Listener = () => void;

export interface FormGroup {
  controls: Record<string, FormControl>;
  getValue(): Record<string, any>;
  setValue(values: Record<string, any>): void;
  getErrors(): Record<string, string | null>;
  isValid(): boolean;
  isTouched(): boolean;
  isDirty(): boolean;
  isValidating(): boolean;
  validate(): Promise<void>;
  markAllTouched(): void;
  reset(values?: Record<string, any>): void;
  subscribe(listener: Listener): () => void;
  destroy(): void;
}

export function createFormGroup(
  controls: Record<string, FormControl>
): FormGroup {
  let isDestroyed = false;
  const listeners = new Set<Listener>();
  const unsubscribers: Array<() => void> = [];

  function notify() {
    if (isDestroyed) return;
    listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('[FormGroup] Listener error:', err);
      }
    });
  }

  // Subscribe to all control changes
  Object.values(controls).forEach(control => {
    const unsub = control.subscribe(() => notify());
    unsubscribers.push(unsub);
  });

  return {
    controls,

    getValue() {
      const values: Record<string, any> = {};
      Object.entries(controls).forEach(([key, ctrl]) => {
        values[key] = ctrl.value;
      });
      return values;
    },

    setValue(values: Record<string, any>) {
      if (isDestroyed) {
        console.warn('[FormGroup] Cannot setValue on destroyed group');
        return;
      }

      Object.entries(values).forEach(([key, val]) => {
        if (controls[key]) {
          controls[key].setValue(val);
        }
      });
    },

    getErrors() {
      const errors: Record<string, string | null> = {};
      Object.entries(controls).forEach(([key, ctrl]) => {
        errors[key] = ctrl.error;
      });
      return errors;
    },

    isValid() {
      return Object.values(controls).every(ctrl => ctrl.valid && !ctrl.validating);
    },

    isTouched() {
      return Object.values(controls).some(ctrl => ctrl.touched);
    },

    isDirty() {
      return Object.values(controls).some(ctrl => ctrl.dirty);
    },

    isValidating() {
      return Object.values(controls).some(ctrl => ctrl.validating);
    },

    async validate() {
      if (isDestroyed) return;

      await Promise.all(
        Object.values(controls).map(ctrl => ctrl.validate())
      );
    },

    markAllTouched() {
      if (isDestroyed) {
        console.warn('[FormGroup] Cannot markAllTouched on destroyed group');
        return;
      }

      Object.values(controls).forEach(ctrl => ctrl.markTouched());
    },

    reset(values?: Record<string, any>) {
      if (isDestroyed) {
        console.warn('[FormGroup] Cannot reset destroyed group');
        return;
      }

      Object.entries(controls).forEach(([key, ctrl]) => {
        const newValue = values?.[key];
        ctrl.reset(newValue);
      });
    },

    subscribe(listener: Listener) {
      if (isDestroyed) {
        console.warn('[FormGroup] Cannot subscribe to destroyed group');
        return () => {};
      }

      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    destroy() {
      if (isDestroyed) return;

      isDestroyed = true;
      unsubscribers.forEach(unsub => unsub());
      listeners.clear();
      
      // Note: We don't destroy child controls - that's the caller's responsibility
    }
  };
}