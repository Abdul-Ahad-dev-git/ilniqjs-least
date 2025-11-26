type ValidatorFn = (value: any) => string | null;
type AsyncValidatorFn = (value: any) => Promise<string | null>;

export const Validators = {
  required: (msg = 'This field is required'): ValidatorFn => (val: any) => {
    if (val === null || val === undefined || val === '') {
      return msg;
    }
    if (typeof val === 'string' && val.trim() === '') {
      return msg;
    }
    if (Array.isArray(val) && val.length === 0) {
      return msg;
    }
    return null;
  },

  minLength: (len: number, msg?: string): ValidatorFn => (val: string) => {
    if (!val) return null;
    return val.length < len ? msg || `Minimum length is ${len}` : null;
  },

  maxLength: (len: number, msg?: string): ValidatorFn => (val: string) => {
    if (!val) return null;
    return val.length > len ? msg || `Maximum length is ${len}` : null;
  },

  min: (min: number, msg?: string): ValidatorFn => (val: number) => {
    if (val === null || val === undefined) return null;
    return val < min ? msg || `Minimum value is ${min}` : null;
  },

  max: (max: number, msg?: string): ValidatorFn => (val: number) => {
    if (val === null || val === undefined) return null;
    return val > max ? msg || `Maximum value is ${max}` : null;
  },

  email: (msg = 'Invalid email address'): ValidatorFn => (val: string) => {
    if (!val) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val) ? null : msg;
  },

  pattern: (regex: RegExp, msg = 'Invalid format'): ValidatorFn => (val: string) => {
    if (!val) return null;
    return regex.test(val) ? null : msg;
  },

  url: (msg = 'Invalid URL'): ValidatorFn => (val: string) => {
    if (!val) return null;
    try {
      new URL(val);
      return null;
    } catch {
      return msg;
    }
  },

  match: (fieldName: string, msg?: string): ValidatorFn => {
    let otherValue: any;
    return (val: any) => {
      if (!val) return null;
      return val === otherValue
        ? null
        : msg || `Must match ${fieldName}`;
    };
  },

  custom: (fn: (val: any) => boolean, msg: string): ValidatorFn => (val: any) => {
    return fn(val) ? null : msg;
  },

  async: (fn: (val: any) => Promise<boolean>, msg: string): AsyncValidatorFn => 
    async (val: any) => {
      try {
        const valid = await fn(val);
        return valid ? null : msg;
      } catch {
        return 'Validation failed';
      }
    }
};