module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // Disable Expo preset that's causing issues
  // preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.expo/'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^react-native-svg$': '<rootDir>/__mocks__/svgMock.js',
    '^@react-native-community/slider$': '<rootDir>/__mocks__/Slider.js',
    '^expo-speech-recognition$': '<rootDir>/__mocks__/expo-speech-recognition.js',
    'modules/expo-media-session$': '<rootDir>/__mocks__/expo-media-session.js',
    'modules/expo-strong-vibration$': '<rootDir>/__mocks__/expo-strong-vibration.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ],
  globals: {
    __DEV__: true
  }
}
