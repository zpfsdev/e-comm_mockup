import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/test/style-mock.ts',
    '^next/image$': '<rootDir>/test/mocks/next-image.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
};

export default config;

