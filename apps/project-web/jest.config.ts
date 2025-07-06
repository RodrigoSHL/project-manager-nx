/* eslint-disable */
export default {
  displayName: 'project-web',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/project-web',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}; 