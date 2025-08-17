jest.mock('expo-constants', () => ({
  manifest: {
    version: '1.0.0',
  },
}));

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: '',
}));

global.__ExpoImportMetaRegistry = {
  getValue: jest.fn(),
};
