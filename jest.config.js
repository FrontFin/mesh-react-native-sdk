module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
};
