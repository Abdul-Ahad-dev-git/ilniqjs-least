// src/__tests__/integration.form.test.ts
import { createFormControl } from '../../forms/control';
import { createFormGroup } from '../../forms/group';
import { Validators } from '../../forms/validators';

describe('Form Integration Tests', () => {

  describe('User Registration Form', () => {
    it('should handle typical registration flow', async () => {
      const emailControl = createFormControl('', [
        Validators.required('Email required'),
        Validators.email('Invalid email')
      ]);

      const passwordControl = createFormControl('', [
        Validators.required('Password required'),
        Validators.minLength(8, 'Password too short')
      ]);

      const confirmPasswordControl = createFormControl('', [
        Validators.required('Confirm password required'),
        Validators.match(() => passwordControl.value, 'password', 'Passwords must match')
      ]);

      const form = createFormGroup({
        email: emailControl,
        password: passwordControl,
        confirmPassword: confirmPasswordControl
      });

      // Initial state
      expect(form.isValid()).toBe(true);
      expect(form.isDirty()).toBe(false);
      expect(form.isTouched()).toBe(false);

      // Invalid input
      emailControl.setValue('bad-email');
      passwordControl.setValue('short');

      await form.validate();
      expect(form.isValid()).toBe(false);
      expect(emailControl.error).toBe('Invalid email');
      expect(passwordControl.error).toBe('Password too short');

      // Correct values
      emailControl.setValue('user@example.com');
      passwordControl.setValue('StrongPass123');
      confirmPasswordControl.setValue('StrongPass123');

      await form.validate();
      expect(form.isValid()).toBe(true);
      expect(form.getValue()).toEqual({
        email: 'user@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123'
      });
    });
  });

  describe('Async Validation', () => {
    it('should validate username availability', async () => {
      const takenUsernames = ['admin', 'test'];
      const asyncCheck = Validators.async(async (val: string) => {
        await new Promise(res => setTimeout(res, 50));
        return !takenUsernames.includes(val);
      }, 'Username taken');

      const usernameControl = createFormControl('', [
        Validators.required(),
        Validators.minLength(3),
        asyncCheck
      ]);

      usernameControl.setValue('admin');
      await usernameControl.validate();
      expect(usernameControl.error).toBe('Username taken');

      usernameControl.setValue('newuser');
      await usernameControl.validate();
      expect(usernameControl.error).toBeNull();
    });

    it('should handle multiple async validators', async () => {
      const asyncA = Validators.async(async (val: string) => val !== 'failA', 'Fail A');
      const asyncB = Validators.async(async (val: string) => val !== 'failB', 'Fail B');

      const control = createFormControl('failA', [asyncA, asyncB]);
      await control.validate();
      expect(control.error).toBe('Fail A');

      control.setValue('failB');
      await control.validate();
      expect(control.error).toBe('Fail B');

      control.setValue('ok');
      await control.validate();
      expect(control.error).toBeNull();
    });
  });

  describe('Validation Modes', () => {
    it('should validate on change', async () => {
      const control = createFormControl('', [Validators.required(), Validators.minLength(5)], 'change');

      control.setValue('ab');
      expect(control.error).toBeNull(); // not yet validated
      await new Promise(res => setTimeout(res, 350));
      expect(control.error).toBe('Minimum length is 5');

      control.setValue('abcdef');
      await new Promise(res => setTimeout(res, 350));
      expect(control.error).toBeNull();
    });

    it('should validate on blur', async () => {
      const control = createFormControl('', [Validators.required()], 'blur');

      control.setValue('test');
      expect(control.error).toBeNull();

      control.markTouched();
      await new Promise(res => setTimeout(res, 10));
      expect(control.error).toBeNull();

      control.setValue('');
      control.markTouched();
      await new Promise(res => setTimeout(res, 10));
      expect(control.error).toBeTruthy();
    });

    it('should validate only on submit', async () => {
      const control = createFormControl('', [Validators.required()], 'submit');

      control.setValue('');
      control.markTouched();
      expect(control.error).toBeNull();

      await control.validate();
      expect(control.error).toBeTruthy();
    });
  });

  describe('Form Group Coordination', () => {
    it('should coordinate multiple controls', async () => {
      const form = createFormGroup({
        firstName: createFormControl('', [Validators.required()]),
        lastName: createFormControl('', [Validators.required()]),
        age: createFormControl('', [Validators.required(), Validators.min(18)])
      });

      await form.validate();
      expect(form.isValid()).toBe(false);
      expect(form.getErrors().firstName).toBeTruthy();
      expect(form.getErrors().lastName).toBeTruthy();
      expect(form.getErrors().age).toBeTruthy();

      form.controls.firstName.setValue('John');
      form.controls.lastName.setValue('Doe');
      form.controls.age.setValue(25);
      await form.validate();
      expect(form.isValid()).toBe(true);
      expect(form.getValue()).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        age: 25
      });
    });
  });

});
