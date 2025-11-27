type Validator<T = any> = (value: T) => string | null | Promise<string | null>;
type ValidationMode = 'change' | 'blur' | 'submit';
type Listener = () => void;
type Widen<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T;
export interface FormControl<T = any> {
  readonly value: T;
  readonly error: string | null;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly validating: boolean;
  readonly valid: boolean;
  setValue(value: T): void;
  setError(error: string | null): void;
  markTouched(): void;
  markDirty(): void;
  validate(): Promise<void>;
  reset(value?: T): void;
  subscribe(listener: Listener): () => void;
  destroy(): void;
}

export function createFormControl<T = any>(
  initialValue: T,
  validators: Validator<Widen<T>>[] = [],
  mode: ValidationMode = 'blur'
): FormControl<Widen<T>> {
  let value = initialValue as Widen<T>;
  let error: string | null = null;
  let touched = false;
  let dirty = false;
  let validating = false;
  let isDestroyed = false;
  let validateTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentValidationId = 0;
  
  const listeners = new Set<Listener>();

  function notify() {
    if (isDestroyed) return;
    listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('[FormControl] Listener error:', err);
      }
    });
  }

  async function runValidation(val: Widen<T>, validationId: number): Promise<string | null> {
    if (isDestroyed || validationId !== currentValidationId) return null;

    for (const validator of validators) {
      try {
        const err = await validator(val);
        if (isDestroyed || validationId !== currentValidationId) return null;
        if (err) return err;
      } catch (err) {
        if (isDestroyed || validationId !== currentValidationId) return null;
        console.error('[FormControl] Validator error:', err);
        return 'Validation error';
      }
    }
    return null;
  }

  async function validateImmediate(): Promise<void> {
    if (isDestroyed || validators.length === 0) return;

    const validationId = ++currentValidationId;
    validating = true;
    notify();

    try {
      const err = await runValidation(value, validationId);
      if (isDestroyed || validationId !== currentValidationId) return;
      error = err;
    } finally {
      if (!isDestroyed && validationId === currentValidationId) {
        validating = false;
        notify();
      }
    }
  }

  function clearValidateTimeout() {
    if (validateTimeout !== null) {
      clearTimeout(validateTimeout);
      validateTimeout = null;
    }
  }

  return {
    get value() {
      return value;
    },

    get error() {
      return error;
    },

    get touched() {
      return touched;
    },

    get dirty() {
      return dirty;
    },

    get validating() {
      return validating;
    },

    get valid() {
      return !error && !validating;
    },

    setValue(val: Widen<T>) {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot setValue on destroyed control');
        return;
      }

      const changed = !Object.is(value, val);
      value = val;
      
      if (changed) {
        dirty = true;
        notify();

        if (mode === 'change') {
          clearValidateTimeout();
          validateTimeout = setTimeout(() => {
            validateTimeout = null;
            if (!isDestroyed) {
              validateImmediate();
            }
          }, 300);
        }
      }
    },

    setError(err: string | null) {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot setError on destroyed control');
        return;
      }
      error = err;
      notify();
    },

    markTouched() {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot markTouched on destroyed control');
        return;
      }

      if (!touched) {
        touched = true;
        notify();
      }

      if (mode === 'blur') {
        validateImmediate();
      }
    },

    markDirty() {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot markDirty on destroyed control');
        return;
      }
      if (!dirty) {
        dirty = true;
        notify();
      }
    },

    async validate(): Promise<void> {
      if (isDestroyed) return;
      await validateImmediate();
    },

    reset(newValue?:Widen<T>) {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot reset destroyed control');
        return;
      }

      clearValidateTimeout();
      currentValidationId++;
      value = newValue !== undefined ? newValue : (initialValue as Widen<T>);
      error = null;
      touched = false;
      dirty = false;
      validating = false;
      notify();
    },

    subscribe(listener: Listener) {
      if (isDestroyed) {
        console.warn('[FormControl] Cannot subscribe to destroyed control');
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
      clearValidateTimeout();
      currentValidationId++;
      listeners.clear();
    }
  };
}