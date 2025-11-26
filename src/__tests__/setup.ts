import '@testing-library/jest-dom';

// Add global type declarations for Node environment
declare global {
  namespace NodeJS {
    interface Global {
      console: Console;
    }
  }
  var console: Console;
}

// Suppress console errors in tests
globalThis.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
} as any;

export {};
