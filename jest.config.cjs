module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts', // Main export file
    '!src/**/index.ts', // Module index files
    '!src/utils/env.ts', // Environment utilities
    '!src/utils/timing.ts', // Timing utilities
  ],
  coveragePathIgnorePatterns: [
  "/node_modules/",
  "forms/hooks.ts",
  "state/devtools.ts",
  "state/hooks.ts",
  "state/persist.ts",
  "utils/memoize.ts",
],
  coverageThreshold: {
    global: {
      statements: 53,
      branches: 45,
      functions: 46,
      lines: 55
    },
    // Set higher thresholds for core modules
    './src/state/store.ts': {
      statements: 85,
      branches: 50,
      functions: 100,
      lines: 85
    },
    './src/http/client.ts': {
 statements: 40,
    branches: 35,
    functions: 40,
    lines: 40,
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};