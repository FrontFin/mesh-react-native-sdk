export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'lcov', 'text'],
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  globals: { 'ts-jest': { diagnostics: false } },
  transform: {},
};