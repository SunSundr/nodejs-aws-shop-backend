module.exports = {
  testEnvironment: 'node',
  displayName: {
    name: 'bff-service',
    color: 'gray',
  },
  roots: ['<rootDir>/test'],
  testRegex: '.*\\.test\\.ts$',
  transform: {'^.+\\.ts$': 'ts-jest'},
  collectCoverageFrom: ['**/*.ts'],
  coveragePathIgnorePatterns: ['serviceUrls.ts', 'types.ts'],
  coverageDirectory: './coverage',
  slowTestThreshold: 20,
};
