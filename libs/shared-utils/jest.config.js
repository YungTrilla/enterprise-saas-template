module.exports = {
  preset: '../../jest.preset.js',
  displayName: 'shared-utils',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.json' }
    ]
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/shared-utils',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts'
  ]
};