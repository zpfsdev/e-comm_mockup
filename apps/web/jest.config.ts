import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/test/style-mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/image$': '<rootDir>/test/mocks/next-image.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
};

export default config;

