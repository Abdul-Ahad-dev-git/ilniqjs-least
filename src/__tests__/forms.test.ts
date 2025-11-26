import { createFormControl } from '../forms/control';
import { createFormGroup } from '../forms/group';
import { Validators } from '../forms/validators';

describe('Form Control', () => {
  it('should create control with initial value', () => {
    const control = createFormControl('test');
    expect(control.value).toBe('test');
  });

  it('should update value', () => {
    const control = createFormControl('');
    control.setValue('new value');
    expect(control.value).toBe('new value');
  });

  it('should validate on blur', async () => {
    const control = createFormControl('', [Validators.required()], 'blur');
    control.markTouched();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(control.error).toBeTruthy();
  });

  it('should validate with custom validator', async () => {
    const control = createFormControl('abc', [
      Validators.minLength(5, 'Too short')
    ]);
    await control.validate();
    expect(control.error).toBe('Too short');
  });

  it('should reset control', () => {
    const control = createFormControl('');
    control.setValue('test');
    control.markTouched();
    control.reset();
    
    expect(control.value).toBe('');
    expect(control.touched).toBe(false);
    expect(control.error).toBe(null);
  });

  it('should cleanup on destroy', () => {
    const control = createFormControl('test');
    control.destroy();
    control.setValue('new'); // Should not throw
  });
});

describe('Form Group', () => {
  it('should get all values', () => {
    const group = createFormGroup({
      name: createFormControl('John'),
      age: createFormControl(25)
    });

    expect(group.getValue()).toEqual({
      name: 'John',
      age: 25
    });
  });

  it('should validate all controls', async () => {
    const group = createFormGroup({
      name: createFormControl('', [Validators.required()]),
      email: createFormControl('', [Validators.required(), Validators.email()])
    });

    await group.validate();

    expect(group.isValid()).toBe(false);
    expect(group.controls.name.error).toBeTruthy();
    expect(group.controls.email.error).toBeTruthy();
  });

  it('should reset all controls', () => {
    const group = createFormGroup({
      name: createFormControl(''),
      age: createFormControl(0)
    });

    group.setValue({ name: 'John', age: 25 });
    group.reset();

    expect(group.getValue()).toEqual({ name: '', age: 0 });
  });
});

describe('Validators', () => {
  it('should validate required', () => {
    const validator = Validators.required();
    expect(validator('')).toBeTruthy();
    expect(validator('value')).toBeNull();
  });

  it('should validate email', () => {
    const validator = Validators.email();
    expect(validator('invalid')).toBeTruthy();
    expect(validator('test@example.com')).toBeNull();
  });

  it('should validate min/max', () => {
    const minValidator = Validators.min(5);
    const maxValidator = Validators.max(10);

    expect(minValidator(3)).toBeTruthy();
    expect(minValidator(7)).toBeNull();
    expect(maxValidator(15)).toBeTruthy();
    expect(maxValidator(8)).toBeNull();
  });
});