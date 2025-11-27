import { createFormControl } from '../../forms/control';
import { createFormGroup } from '../../forms/group';
import { Validators } from '../../forms/validators';

describe('FormGroup', () => {
  describe('initialization', () => {
    it('should create group with controls', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      expect(group.controls.name.value).toBe('John');
      expect(group.controls.age.value).toBe(25);
    });

    it('should subscribe to control changes', () => {
      const nameControl = createFormControl('');
      const group = createFormGroup({ name: nameControl });
      const listener = jest.fn();
      
      group.subscribe(listener);
      nameControl.setValue('John');
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('getValue', () => {
    it('should get all control values', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        email: createFormControl('john@example.com'),
        age: createFormControl(25)
      });

      expect(group.getValue()).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 25
      });
    });

    it('should reflect current values', () => {
      const group = createFormGroup({
        name: createFormControl('John')
      });

      group.controls.name.setValue('Jane');
      expect(group.getValue()).toEqual({ name: 'Jane' });
    });
  });

  describe('setValue', () => {
    it('should set multiple control values', () => {
      const group = createFormGroup({
        name: createFormControl(''),
        age: createFormControl(0)
      });

      group.setValue({ name: 'John', age: 25 });

      expect(group.getValue()).toEqual({ name: 'John', age: 25 });
    });

    it('should ignore unknown keys', () => {
      const group = createFormGroup({
        name: createFormControl('')
      });

      group.setValue({ name: 'John', unknown: 'value' });
      expect(group.getValue()).toEqual({ name: 'John' });
    });

    it('should handle partial updates', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      group.setValue({ name: 'Jane' });
      expect(group.getValue()).toEqual({ name: 'Jane', age: 25 });
    });
  });

  describe('getErrors', () => {
    it('should get all control errors', async () => {
      const group = createFormGroup({
        name: createFormControl('', [Validators.required()]),
        email: createFormControl('invalid', [Validators.email()])
      });

      await group.validate();

      const errors = group.getErrors();
      expect(errors.name).toBeTruthy();
      expect(errors.email).toBeTruthy();
    });

    it('should return null for valid controls', async () => {
      const group = createFormGroup({
        name: createFormControl('John', [Validators.required()])
      });

      await group.validate();
      expect(group.getErrors().name).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true when all controls are valid', async () => {
      const group = createFormGroup({
        name: createFormControl('John', [Validators.required()]),
        email: createFormControl('john@example.com', [Validators.email()])
      });

      await group.validate();
      expect(group.isValid()).toBe(true);
    });

    it('should return false when any control is invalid', async () => {
      const group = createFormGroup({
        name: createFormControl('', [Validators.required()]),
        email: createFormControl('john@example.com', [Validators.email()])
      });

      await group.validate();
      expect(group.isValid()).toBe(false);
    });

    it('should return false when any control is validating', async () => {
      const slowValidator = async (val: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return val ? null : 'Required';
      };

      const group = createFormGroup({
        name: createFormControl('test', [slowValidator])
      });

      const promise = group.validate();
      expect(group.isValid()).toBe(false);
      
      await promise;
      expect(group.isValid()).toBe(true);
    });
  });

  describe('isTouched', () => {
    it('should return true if any control is touched', () => {
      const group = createFormGroup({
        name: createFormControl(''),
        age: createFormControl(0)
      });

      expect(group.isTouched()).toBe(false);
      
      group.controls.name.markTouched();
      expect(group.isTouched()).toBe(true);
    });

    it('should return false when no controls are touched', () => {
      const group = createFormGroup({
        name: createFormControl(''),
        age: createFormControl(0)
      });

      expect(group.isTouched()).toBe(false);
    });
  });

  describe('isDirty', () => {
    it('should return true if any control is dirty', () => {
      const group = createFormGroup({
        name: createFormControl(''),
        age: createFormControl(0)
      });

      expect(group.isDirty()).toBe(false);
      
      group.controls.name.setValue('John');
      expect(group.isDirty()).toBe(true);
    });

    it('should return false when no controls are dirty', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      expect(group.isDirty()).toBe(false);
    });
  });

  describe('isValidating', () => {
    it('should return true if any control is validating', async () => {
      const slowValidator = async (val: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return null;
      };

      const group = createFormGroup({
        name: createFormControl('test', [slowValidator])
      });

      const promise = group.validate();
      expect(group.isValidating()).toBe(true);
      
      await promise;
      expect(group.isValidating()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate all controls', async () => {
      const group = createFormGroup({
        name: createFormControl('', [Validators.required()]),
        email: createFormControl('', [Validators.required(), Validators.email()])
      });

      await group.validate();

      expect(group.controls.name.error).toBeTruthy();
      expect(group.controls.email.error).toBeTruthy();
      expect(group.isValid()).toBe(false);
    });

    it('should validate in parallel', async () => {
      const startTimes: number[] = [];
      const slowValidator = async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        return null;
      };

      const group = createFormGroup({
        field1: createFormControl('test', [slowValidator]),
        field2: createFormControl('test', [slowValidator])
      });

      const start = Date.now();
      await group.validate();
      const duration = Date.now() - start;

      // Should be closer to 50ms (parallel) than 100ms (sequential)
      expect(duration).toBeLessThan(80);
    });
  });

  describe('markAllTouched', () => {
    it('should mark all controls as touched', () => {
      const group = createFormGroup({
        name: createFormControl(''),
        email: createFormControl(''),
        age: createFormControl(0)
      });

      group.markAllTouched();

      expect(group.controls.name.touched).toBe(true);
      expect(group.controls.email.touched).toBe(true);
      expect(group.controls.age.touched).toBe(true);
    });

    it('should trigger validation for blur mode controls', async () => {
      const group = createFormGroup({
        name: createFormControl('', [Validators.required()], 'blur')
      });

      group.markAllTouched();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(group.controls.name.error).toBeTruthy();
    });
  });

  describe('reset', () => {
    it('should reset all controls to initial values', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      group.setValue({ name: 'Jane', age: 30 });
      group.markAllTouched();
      
      group.reset();

      expect(group.getValue()).toEqual({ name: 'John', age: 25 });
      expect(group.isTouched()).toBe(false);
      expect(group.isDirty()).toBe(false);
    });

    it('should reset to new values if provided', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      group.reset({ name: 'Jane', age: 30 });

      expect(group.getValue()).toEqual({ name: 'Jane', age: 30 });
    });

    it('should handle partial reset values', () => {
      const group = createFormGroup({
        name: createFormControl('John'),
        age: createFormControl(25)
      });

      group.reset({ name: 'Jane' });

      expect(group.getValue()).toEqual({ name: 'Jane', age: 25 });
    });
  });

  describe('subscription', () => {
    it('should notify on control changes', () => {
      const group = createFormGroup({
        name: createFormControl('')
      });

      const listener = jest.fn();
      group.subscribe(listener);

      group.controls.name.setValue('John');
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribe', () => {
      const group = createFormGroup({
        name: createFormControl('')
      });

      const listener = jest.fn();
      const unsubscribe = group.subscribe(listener);
      unsubscribe();

      group.controls.name.setValue('John');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const group = createFormGroup({
        name: createFormControl('')
      });

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      group.subscribe(listener1);
      group.subscribe(listener2);

      group.controls.name.setValue('John');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should cleanup subscriptions', () => {
      const nameControl = createFormControl('');
      const group = createFormGroup({ name: nameControl });
      const listener = jest.fn();

      group.subscribe(listener);
      group.destroy();

      nameControl.setValue('John');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not destroy child controls', () => {
      const nameControl = createFormControl('John');
      const group = createFormGroup({ name: nameControl });

      group.destroy();

      // Control should still work
      nameControl.setValue('Jane');
      expect(nameControl.value).toBe('Jane');
    });

    it('should prevent operations after destroy', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      const group = createFormGroup({
        name: createFormControl('')
      });

      group.destroy();
      group.setValue({ name: 'John' });
      group.reset();

      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('should be idempotent', () => {
      const group = createFormGroup({
        name: createFormControl('')
      });

      group.destroy();
      group.destroy();
      // Should not throw
    });
  });
});