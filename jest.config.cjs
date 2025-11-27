module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/**/index.ts',
    '!src/utils/env.ts',
    '!src/utils/timing.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'forms/hooks.ts',
    'state/devtools.ts',
    'state/hooks.ts',
    'state/persist.ts',
    'utils/memoize.ts',
  ],
coverageThreshold: {
  global: {
    statements: 53,
    branches: 45,
    functions: 46,
    lines: 55,
  },
  './src/forms/validators.ts': {
    branches: 0,
  },
},

  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // ------------------ Updated ts-jest config ------------------
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};