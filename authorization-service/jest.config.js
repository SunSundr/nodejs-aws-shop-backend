module.exports = {
  testEnvironment: 'node',
  displayName: {
    name: 'authorization-service',
    color: 'yellow',
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
