type Validator<T = any> = (value: T) => string | null | Promise<string | null>;
type ValidationMode = 'change' | 'blur' | 'submit';

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
  destroy(): void;
}

export function createFormControl<T = any>(
  initialValue: T,
  validators: Validator<T>[] = [],
  mode: ValidationMode = 'blur'
): FormControl<T> {
  let value = initialValue;
  let error: string | null = null;
  let touched = false;
  let dirty = false;
  let validating = false;
  let isDestroyed = false;
  let validateTimeout: any;
  let validationPromise: Promise<void> | null = null;

  async function runValidation(val: T): Promise<string | null> {
    if (isDestroyed) return null;

    for (const validator of validators) {
      try {
        const err = await validator(val);
        if (err && !isDestroyed) {
          return err;
        }
      } catch (err) {
        if (!isDestroyed) {
          console.error('[FormControl] Validator error:', err);
          return 'Validation error';
        }
      }
    }
    return null;
  }

  async function validateImmediate(): Promise<void> {
    if (isDestroyed) return;

    validating = true;
    try {
      const err = await runValidation(value);
      if (!isDestroyed) {
        error = err;
      }
    } finally {
      if (!isDestroyed) {
        validating = false;
      }
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

    setValue(val: T) {
      if (isDestroyed) return;

      const changed = !Object.is(value, val);
      value = val;

      if (changed) {
        dirty = true;

        if (mode === 'change') {
          clearTimeout(validateTimeout);
          validateTimeout = setTimeout(() => {
            if (!isDestroyed) {
              validateImmediate();
            }
          }, 300);
        }
      }
    },

    setError(err: string | null) {
      if (!isDestroyed) {
        error = err;
      }
    },

    markTouched() {
      if (isDestroyed) return;

      touched = true;

      if (mode === 'blur') {
        validateImmediate();
      }
    },

    markDirty() {
      if (!isDestroyed) {
        dirty = true;
      }
    },

    async validate(): Promise<void> {
      if (isDestroyed) return;

      // Reuse existing validation promise if running
      if (validationPromise) {
        return validationPromise;
      }

      validationPromise = validateImmediate().finally(() => {
        validationPromise = null;
      });

      return validationPromise;
    },

    reset(newValue?: T) {
      if (isDestroyed) return;

      clearTimeout(validateTimeout);
      value = newValue !== undefined ? newValue : initialValue;
      error = null;
      touched = false;
      dirty = false;
      validating = false;
    },

    destroy() {
      if (isDestroyed) return;

      isDestroyed = true;
      clearTimeout(validateTimeout);
      validationPromise = null;
    }
  };
}
