import { createFormControl } from "../../forms/control";
import { Validators } from '../../forms/validators';

describe('FormControl', () => {
  describe('initialization', () => {
    it('should create control with initial value', () => {
      const control = createFormControl('test');
      expect(control.value).toBe('test');
      expect(control.error).toBeNull();
      expect(control.touched).toBe(false);
      expect(control.dirty).toBe(false);
      expect(control.validating).toBe(false);
      expect(control.valid).toBe(true);
    });

    it('should accept validators and validation mode', () => {
      const control = createFormControl('', [Validators.required()], 'change');
      expect(control.value).toBe('');
    });
  });

  describe('setValue', () => {
    it('should update value', () => {
      const control = createFormControl('');
      control.setValue('new value');
      expect(control.value).toBe('new value');
    });

    it('should mark as dirty on value change', () => {
      const control = createFormControl('');
      expect(control.dirty).toBe(false);
      control.setValue('changed');
      expect(control.dirty).toBe(true);
    });

    it('should not mark dirty if value is the same', () => {
      const control = createFormControl('test');
      
      control.setValue('test');
      expect(control.dirty).toBe(false);
    });

    it('should notify subscribers on value change', () => {
      const control = createFormControl('');
      const listener = jest.fn();
      control.subscribe(listener);
      
      control.setValue('new');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should validate on change mode with debounce', async () => {
      const control = createFormControl('', [Validators.required()], 'change');
      
      control.setValue("abc");
      expect(control.validating).toBe(false);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(control.error).toBeNull();
      expect(control.valid).toBe(true);
    });

    it('should not validate on blur mode', () => {
      const control = createFormControl('', [Validators.required()], 'blur');
      control.setValue('value');
      expect(control.error).toBeNull();
    });

    it('should warn when setting value on destroyed control', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      const control = createFormControl('test');
      control.destroy();
      control.setValue('new');
      
      expect(spy).toHaveBeenCalledWith(
        '[FormControl] Cannot setValue on destroyed control'
      );
      spy.mockRestore();
    });
  });

  describe('markTouched', () => {
    it('should mark control as touched', () => {
      const control = createFormControl('');
      expect(control.touched).toBe(false);
      control.markTouched();
      expect(control.touched).toBe(true);
    });

    it('should validate on blur mode', async () => {
      const control = createFormControl('', [Validators.required()], 'blur');
      control.markTouched();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(control.error).toBeTruthy();
    });

    it('should notify subscribers', () => {
      const control = createFormControl('');
      const listener = jest.fn();
      control.subscribe(listener);
      
      control.markTouched();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate synchronously', async () => {
      const control = createFormControl('abc', [Validators.minLength(5)]);
      await control.validate();
      expect(control.error).toBe('Minimum length is 5');
      expect(control.valid).toBe(false);
    });

    it('should validate asynchronously', async () => {
      const asyncValidator = Validators.async(
        async (val) => val.length > 3,
        'Too short'
      );
      const control = createFormControl('ab', [asyncValidator]);
      
      await control.validate();
      expect(control.error).toBe('Too short');
    });

    it('should set validating state during validation', async () => {
      const slowValidator = async (val: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return val ? null : 'Required';
      };
      
      const control = createFormControl('test', [slowValidator]);
      const promise = control.validate();
      
      expect(control.validating).toBe(true);
      await promise;
      expect(control.validating).toBe(false);
    });

    it('should run all validators until first error', async () => {
      const validator1 = jest.fn(() => null);
      const validator2 = jest.fn(() => 'Error');
      const validator3 = jest.fn(() => null);
      
      const control = createFormControl('test', [validator1, validator2, validator3]);
      await control.validate();
      
      expect(validator1).toHaveBeenCalled();
      expect(validator2).toHaveBeenCalled();
      expect(validator3).not.toHaveBeenCalled();
      expect(control.error).toBe('Error');
    });

    it('should handle validator exceptions', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      const throwingValidator = () => {
        throw new Error('Validator failed');
      };
      
      const control = createFormControl('test', [throwingValidator]);
      await control.validate();
      
      expect(control.error).toBe('Validation error');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should cancel validation on destroy', async () => {
      const control = createFormControl('', [Validators.required()]);
      const promise = control.validate();
      control.destroy();
      
      await promise;
      // Should not throw or set error after destroy
    });

    it('should handle race conditions with multiple validations', async () => {
      let validationCount = 0;
      const slowValidator = async (val: string) => {
        const id = ++validationCount;
        await new Promise(resolve => setTimeout(resolve, id === 1 ? 100 : 10));
        return val ? null : `Error ${id}`;
      };
      
      const control = createFormControl('', [slowValidator]);
      
      // Start first validation (slower)
      const promise1 = control.validate();
      
      // Start second validation immediately (faster)
      await new Promise(resolve => setTimeout(resolve, 5));
      const promise2 = control.validate();
      
      await Promise.all([promise1, promise2]);
      
      // Second validation should win
      expect(control.error).toBe('Error 2');
    });
  });

  describe('reset', () => {
    it('should reset to initial value', () => {
      const control = createFormControl('initial');
      control.setValue('changed');
      control.markTouched();
      control.setError('error');
      
      control.reset();
      
      expect(control.value).toBe('initial');
      expect(control.touched).toBe(false);
      expect(control.dirty).toBe(false);
      expect(control.error).toBeNull();
    });

    it('should reset to new value if provided', () => {
      const control = createFormControl('initial');
      control.reset('new initial');
      expect(control.value).toBe('new initial');
    });

    it('should clear pending validation', async () => {
      const control = createFormControl('', [Validators.required()], 'change');
      control.setValue('test');
      
      // Reset before debounce completes
      control.reset();
      
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(control.error).toBeNull();
    });

    it('should notify subscribers', () => {
      const control = createFormControl('test');
      const listener = jest.fn();
      control.subscribe(listener);
      
      control.reset();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('subscription', () => {
    it('should notify subscriber on changes', () => {
      const control = createFormControl('');
      const listener = jest.fn();
      
      control.subscribe(listener);
      control.setValue('new');
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribe', () => {
      const control = createFormControl('');
      const listener = jest.fn();
      
      const unsubscribe = control.subscribe(listener);
      unsubscribe();
      
      control.setValue('new');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const control = createFormControl('');
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      control.subscribe(listener1);
      control.subscribe(listener2);
      control.setValue('new');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should catch listener errors', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      const control = createFormControl('');
      
      control.subscribe(() => {
        throw new Error('Listener error');
      });
      
      control.setValue('new');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      const control = createFormControl('test');
      const listener = jest.fn();
      control.subscribe(listener);
      
      control.destroy();
      control.setValue('new');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should prevent operations after destroy', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      const control = createFormControl('test');
      control.destroy();
      
      control.setValue('new');
      control.markTouched();
      control.reset();
      
      expect(spy).toHaveBeenCalledTimes(3);
      spy.mockRestore();
    });

    it('should be idempotent', () => {
      const control = createFormControl('test');
      control.destroy();
      control.destroy();
      // Should not throw
    });
  });
});