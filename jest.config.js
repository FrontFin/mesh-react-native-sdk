module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'lcov', 'text'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
};
