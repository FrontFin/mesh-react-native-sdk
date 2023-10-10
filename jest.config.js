module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageReporters: ['json', 'html'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
};
