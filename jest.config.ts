import type { Config } from '@jest/types'

import packageJson from './package.json'

const config: Config.InitialOptions = {
  displayName: packageJson.name,
  testTimeout: 120000,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  coveragePathIgnorePatterns: ['/build/', '/node_modules/', '/__tests__/', 'tests'],
  transformIgnorePatterns: ['node_modules/(?!axios. *)'],
  coverageDirectory: '<rootDir>/coverage/',
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
}

export default config
