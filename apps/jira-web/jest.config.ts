export default {
  displayName: 'jira-web',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@project-manager/security-navigation$': '<rootDir>/../../libs/security-navigation/src/index.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageDirectory: '../../coverage/apps/jira-web',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}
