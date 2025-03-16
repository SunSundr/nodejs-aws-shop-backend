module.exports = {
  testEnvironment: 'node',
  displayName: {
    name: 'product-service',
    color: 'magenta',
  },
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coveragePathIgnorePatterns: ['@.*\\.ts'],
  testTimeout: 20000,
  slowTestThreshold: 25,
};
