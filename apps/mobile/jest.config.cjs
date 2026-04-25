/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  moduleNameMapper: {
    '^@fitnessapp/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^react-dom$': '<rootDir>/__mocks__/react-dom.js',
    // The shared package uses ESM-style explicit `.js` extensions for Node
    // NodeNext resolution. Strip them when jest-expo's babel transformer
    // resolves modules.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/App.tsx',
    '!src/services/nativeSecureStorage.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
