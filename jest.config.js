module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/server.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/helpers/testSetup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    'src/__tests__/helpers/'
  ],
  verbose: true,
  clearMocks: true
};
