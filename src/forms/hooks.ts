import { useState, useCallback, useEffect, useMemo } from 'react';
import type { FormControl } from './control';
import type { FormGroup } from './group';

export function useFormControl<T>(control: FormControl<T>) {
  const [, forceUpdate] = useState({});

  // Subscribe to control changes
  useEffect(() => {
    const unsubscribe = control.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [control]);

  // Memoize callbacks to prevent unnecessary re-renders
  const setValue = useCallback((val: T) => {
    control.setValue(val);
  }, [control]);

  const setError = useCallback((error: string | null) => {
    control.setError(error);
  }, [control]);

  const markTouched = useCallback(() => {
    control.markTouched();
  }, [control]);

  const markDirty = useCallback(() => {
    control.markDirty();
  }, [control]);

  const validate = useCallback(async () => {
    await control.validate();
  }, [control]);

  const reset = useCallback((val?: T) => {
    control.reset(val);
  }, [control]);

  return {
    value: control.value,
    error: control.error,
    touched: control.touched,
    dirty: control.dirty,
    validating: control.validating,
    valid: control.valid,
    setValue,
    setError,
    markTouched,
    markDirty,
    validate,
    reset
  };
}

export function useFormGroup(group: FormGroup) {
  const [, forceUpdate] = useState({});

  // Subscribe to group changes
  useEffect(() => {
    const unsubscribe = group.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [group]);

  const setValue = useCallback((values: Record<string, any>) => {
    group.setValue(values);
  }, [group]);

  const validate = useCallback(async () => {
    await group.validate();
  }, [group]);

  const markAllTouched = useCallback(() => {
    group.markAllTouched();
  }, [group]);

  const reset = useCallback((values?: Record<string, any>) => {
    group.reset(values);
  }, [group]);

  // Memoize derived state
  const value = useMemo(() => group.getValue(), [group, group.getValue()]);
  const errors = useMemo(() => group.getErrors(), [group, group.getErrors()]);

  return {
    controls: group.controls,
    value,
    errors,
    isValid: group.isValid(),
    isTouched: group.isTouched(),
    isDirty: group.isDirty(),
    isValidating: group.isValidating(),
    setValue,
    validate,
    markAllTouched,
    reset
  };
}

// Helper hook for individual control field binding
export function useField<T>(control: FormControl<T>) {
  const { value, error, touched, setValue, markTouched } = useFormControl(control);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value as T);
  }, [setValue]);

  const handleBlur = useCallback(() => {
    markTouched();
  }, [markTouched]);

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched ? error : null,
    hasError: touched && !!error
  };
}