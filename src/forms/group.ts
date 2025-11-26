import type { FormControl } from './control';

export interface FormGroup {
  controls: Record<string, FormControl>;
  getValue(): Record<string, any>;
  setValue(values: Record<string, any>): void;
  getErrors(): Record<string, string | null>;
  isValid(): boolean;
  isTouched(): boolean;
  isDirty(): boolean;
  validate(): Promise<void>;
  reset(values?: Record<string, any>): void;
  destroy(): void;
}

export function createFormGroup(
  controls: Record<string, FormControl>
): FormGroup {
  let isDestroyed = false;

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
      if (isDestroyed) return;

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
      return Object.values(controls).every(ctrl => ctrl.valid);
    },

    isTouched() {
      return Object.values(controls).some(ctrl => ctrl.touched);
    },

    isDirty() {
      return Object.values(controls).some(ctrl => ctrl.dirty);
    },

    async validate() {
      if (isDestroyed) return;

      await Promise.all(
        Object.values(controls).map(ctrl => ctrl.validate())
      );
    },

    reset(values?: Record<string, any>) {
      if (isDestroyed) return;

      Object.entries(controls).forEach(([key, ctrl]) => {
        const newValue = values?.[key];
        ctrl.reset(newValue);
      });
    },

    destroy() {
      if (isDestroyed) return;

      isDestroyed = true;
      Object.values(controls).forEach(ctrl => ctrl.destroy());
    }
  };
}