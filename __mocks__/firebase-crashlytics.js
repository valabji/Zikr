module.exports = {
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  recordError: jest.fn(),
  log: jest.fn(),
};
