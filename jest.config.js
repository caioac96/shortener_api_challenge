module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: 'src/.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^entities/(.*)$': '<rootDir>/src/entities/$1',
    '^modules/(.*)$': '<rootDir>/src/modules/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
  },
};