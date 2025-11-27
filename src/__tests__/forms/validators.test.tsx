// src/__tests__/validators.test.ts
import { Validators } from '../../forms/validators';

describe('Validators Unit Tests', () => {

  describe('required', () => {
    const validator = Validators.required('Field required');

    it('returns error for null, undefined, empty string', () => {
      expect(validator(null)).toBe('Field required');
      expect(validator(undefined)).toBe('Field required');
      expect(validator('')).toBe('Field required');
    });

    it('returns error for string with only spaces', () => {
      expect(validator('   ')).toBe('Field required');
    });

    it('returns error for empty array', () => {
      expect(validator([])).toBe('Field required');
    });

    it('returns null for valid values', () => {
      expect(validator('hello')).toBeNull();
      expect(validator([1])).toBeNull();
      expect(validator(0)).toBeNull();
    });
  });

  describe('minLength & maxLength', () => {
    const min = Validators.minLength(3);
    const max = Validators.maxLength(5);

    it('minLength returns error for short strings', () => {
      expect(min('ab')).toBe('Minimum length is 3');
      expect(min('abc')).toBeNull();
      expect(min('')).toBeNull(); // empty skips check
    });

    it('maxLength returns error for long strings', () => {
      expect(max('abcdef')).toBe('Maximum length is 5');
      expect(max('abc')).toBeNull();
      expect(max('')).toBeNull();
    });
  });

  describe('min & max', () => {
    const minVal = Validators.min(10);
    const maxVal = Validators.max(20);

    it('min returns error for numbers below minimum', () => {
      expect(minVal(5)).toBe('Minimum value is 10');
      expect(minVal(10)).toBeNull();
      expect(minVal(null)).toBeNull();
      expect(minVal('abc')).toBeNull();
    });

    it('max returns error for numbers above maximum', () => {
      expect(maxVal(25)).toBe('Maximum value is 20');
      expect(maxVal(15)).toBeNull();
      expect(maxVal(undefined)).toBeNull();
      expect(maxVal('xyz')).toBeNull();
    });
  });

  describe('email', () => {
    const email = Validators.email('Invalid email');

    it('returns error for invalid emails', () => {
      expect(email('')).toBeNull(); // empty skips check
      expect(email('abc')).toBe('Invalid email');
      expect(email('test@domain')).toBe('Invalid email');
    });

    it('returns null for valid emails', () => {
      expect(email('user@example.com')).toBeNull();
    });
  });

  describe('pattern', () => {
    const pattern = Validators.pattern(/^\d+$/, 'Must be digits');

    it('validates correctly', () => {
      expect(pattern('123')).toBeNull();
      expect(pattern('abc')).toBe('Must be digits');
      expect(pattern('')).toBeNull();
    });
  });

  describe('url', () => {
    const url = Validators.url('Invalid URL');

    it('validates URLs', () => {
      expect(url('http://example.com')).toBeNull();
      expect(url('https://example.com')).toBeNull();
      expect(url('invalid-url')).toBe('Invalid URL');
      expect(url('')).toBeNull();
    });
  });

  describe('match', () => {
    let value = 'abc';
    const match = Validators.match(() => value, 'field');

    it('matches correctly', () => {
      expect(match('abc')).toBeNull();
      expect(match('xyz')).toBe('Must match field');
      expect(match('')).toBeNull(); // empty skips check
    });
  });

  describe('custom', () => {
    const custom = Validators.custom((v) => v > 0, 'Must be positive');

    it('validates correctly', () => {
      expect(custom(1)).toBeNull();
      expect(custom(0)).toBe('Must be positive');
    });
  });

  describe('async', () => {
    const asyncValid = Validators.async(async (v) => v === 'ok', 'Failed');

    it('resolves valid', async () => {
      await expect(asyncValid('ok')).resolves.toBeNull();
    });

    it('resolves invalid', async () => {
      await expect(asyncValid('no')).resolves.toBe('Failed');
    });

    it('handles rejection', async () => {
      const asyncFail = Validators.async(async () => { throw new Error('oops'); }, 'Failed');
      await expect(asyncFail('anything')).resolves.toBe('Validation failed');
    });
  });

  describe('requiredTrue', () => {
    const reqTrue = Validators.requiredTrue();

    it('validates boolean true', () => {
      expect(reqTrue(true)).toBeNull();
      expect(reqTrue(false)).toBe('Must be checked');
      expect(reqTrue(null)).toBe('Must be checked');
    });
  });

  describe('numeric & integer', () => {
    const numeric = Validators.numeric();
    const integer = Validators.integer();

    it('numeric validates numbers', () => {
      expect(numeric('123')).toBeNull();
      expect(numeric('abc')).toBe('Must be a number');
      expect(numeric('')).toBeNull();
    });

    it('integer validates integers', () => {
      expect(integer('123')).toBeNull();
      expect(integer('123.4')).toBe('Must be an integer');
      expect(integer('abc')).toBe('Must be an integer');
    });
  });

  describe('alphanumeric', () => {
    const alpha = Validators.alphanumeric();

    it('validates alphanumeric strings', () => {
      expect(alpha('abc123')).toBeNull();
      expect(alpha('abc_123')).toBe('Must contain only letters and numbers');
      expect(alpha('')).toBeNull();
    });
  });

  describe('phone', () => {
    const phone = Validators.phone();

    it('validates phone numbers', () => {
      expect(phone('1234567890')).toBeNull();
      expect(phone('+1 (234) 567-8901')).toBeNull();
      expect(phone('123')).toBe('Invalid phone number');
      expect(phone('abc')).toBe('Invalid phone number');
      expect(phone('')).toBeNull();
    });
  });

});
