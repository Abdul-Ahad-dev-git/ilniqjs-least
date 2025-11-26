
import { useState, useCallback, useEffect } from 'react';
import type { FormControl } from './control';
import type { FormGroup } from './group';

export function useFormControl<T>(control: FormControl<T>) {
  const [, forceUpdate] = useState({});

  const setValue = useCallback((val: T) => {
    control.setValue(val);
    forceUpdate({});
  }, [control]);

  const markTouched = useCallback(() => {
    control.markTouched();
    forceUpdate({});
  }, [control]);

  const validate = useCallback(async () => {
    await control.validate();
    forceUpdate({});
  }, [control]);

  const reset = useCallback((val?: T) => {
    control.reset(val);
    forceUpdate({});
  }, [control]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      control.destroy();
    };
  }, [control]);

  return {
    value: control.value,
    error: control.error,
    touched: control.touched,
    dirty: control.dirty,
    validating: control.validating,
    valid: control.valid,
    setValue,
    markTouched,
    validate,
    reset
  };
}

export function useFormGroup(group: FormGroup) {
  const [, forceUpdate] = useState({});

  const setValue = useCallback((values: Record<string, any>) => {
    group.setValue(values);
    forceUpdate({});
  }, [group]);

  const validate = useCallback(async () => {
    await group.validate();
    forceUpdate({});
  }, [group]);

  const reset = useCallback((values?: Record<string, any>) => {
    group.reset(values);
    forceUpdate({});
  }, [group]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      group.destroy();
    };
  }, [group]);

  return {
    controls: group.controls,
    value: group.getValue(),
    errors: group.getErrors(),
    isValid: group.isValid(),
    isTouched: group.isTouched(),
    isDirty: group.isDirty(),
    setValue,
    validate,
    reset
  };
}