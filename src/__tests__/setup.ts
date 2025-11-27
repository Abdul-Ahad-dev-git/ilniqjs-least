import '@testing-library/jest-dom';

// Global type declarations
declare global {
  namespace NodeJS {
    interface Global {
      console: Console;
    }
  }
  var console: Console;
}

// Suppress console errors/warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

afterEach(() => {
  jest.clearAllMocks();
});

jest.setTimeout(10000);

export {};