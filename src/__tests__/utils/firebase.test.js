// Set env var BEFORE any imports so module-load-time reads see a valid value.
process.env.EXPO_PUBLIC_FIREBASE_CONFIG = JSON.stringify({
  apiKey: 'test',
  storageBucket: 'gs://test.appspot.com',
});

jest.mock('@react-native-firebase/analytics', () => ({
  logEvent: jest.fn(() => Promise.resolve()),
  getAnalytics: jest.fn(() => ({ __isAnalytics: true })),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    setReactNativeAsyncStorage: jest.fn(),
    initializeApp: jest.fn(),
  },
}));

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.2.3' }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.2.4' } } }));

const { logEvent, getAnalytics } = require('@react-native-firebase/analytics');
const firebase = require('@react-native-firebase/app').default;
import LogEvent from '@/utils/firebase/events';
import loadFirebaseAnalytics from '@/utils/firebase/load';

describe('firebase/events.LogEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Platform.OS = 'ios';
  });

  it('logs the event with version, platform, notes, and extra params', async () => {
    await LogEvent('screen_view', { screen_name: 'Home' });
    // Allow the .then() in logEvent to settle
    await new Promise((r) => setImmediate(r));
    expect(logEvent).toHaveBeenCalledTimes(1);
    const [analytics, title, params] = logEvent.mock.calls[0];
    expect(analytics).toEqual({ __isAnalytics: true });
    expect(title).toBe('screen_view');
    expect(params).toMatchObject({
      version: '1.2.3',
      platform: 'ios',
      screen_name: 'Home',
      notes: '1.2.3 - ios',
    });
  });

  it('falls back to expoConfig.version when nativeApplicationVersion is missing', async () => {
    // Override the value on the module instance instead of resetModules
    const expoApp = require('expo-application');
    const originalVersion = expoApp.nativeApplicationVersion;
    expoApp.nativeApplicationVersion = null;
    try {
      await LogEvent('test', {});
      await new Promise((r) => setImmediate(r));
      // expo-constants mock returns version: '1.2.4'
      expect(logEvent.mock.calls.at(-1)[2].version).toBe('1.2.4');
    } finally {
      expoApp.nativeApplicationVersion = originalVersion;
    }
  });

  it('logs and does not throw if logEvent rejects', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logEvent.mockReturnValueOnce(Promise.reject(new Error('analytics down')));
    await LogEvent('boom', {});
    await new Promise((r) => setImmediate(r));
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('firebase/load.loadFirebaseAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_FIREBASE_CONFIG = JSON.stringify({
      apiKey: 'test',
      storageBucket: 'gs://test.appspot.com',
    });
  });

  afterEach(() => {
    global.Platform.OS = 'ios';
  });

  it('on native, only logs the app-loaded event', async () => {
    global.Platform.OS = 'ios';
    await loadFirebaseAnalytics();
    expect(firebase.initializeApp).not.toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(
      { __isAnalytics: true },
      'App_Loaded_Successfully',
      expect.objectContaining({ my_note: 'working from env' })
    );
  });

  // load.js reads `process.env.EXPO_PUBLIC_FIREBASE_CONFIG`, which babel-preset-expo
  // inlines at compile time. Whether it inlines as `undefined` or a real JSON string
  // depends on the env the test runner was launched with (e.g. act loads .env), so we
  // can't predict whether the function resolves or rejects — just that setReactNativeAsyncStorage
  // runs first on web.
  it('on web, invokes setReactNativeAsyncStorage', async () => {
    global.Platform.OS = 'web';
    await loadFirebaseAnalytics().catch(() => {});
    expect(firebase.setReactNativeAsyncStorage).toHaveBeenCalled();
  });
});
