module.exports = {
  testEnvironment: 'node',
  displayName: {
    name: 'import-service',
    color: 'cyan',
  },
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coveragePathIgnorePatterns: ['<rootDir>/lib/constants', '@.*\\.ts'],
  testTimeout: 20000,
  slowTestThreshold: 25,
};
