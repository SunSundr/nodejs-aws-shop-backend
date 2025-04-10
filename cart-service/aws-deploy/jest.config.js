module.exports = {
  testEnvironment: 'node',
  displayName: {
    name: 'cart-service',
    color: 'blue',
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
