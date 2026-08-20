module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@channels/(.*)$': '<rootDir>/src/channels/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@kafka/(.*)$': '<rootDir>/src/kafka/$1',
    '^@scheduler/(.*)$': '<rootDir>/src/scheduler/$1',
    '^@redis/(.*)$': '<rootDir>/src/redis/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
