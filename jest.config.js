module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
};
