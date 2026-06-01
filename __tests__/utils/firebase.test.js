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
import LogEvent from '../../utils/firebase/events';
import loadFirebaseAnalytics from '../../utils/firebase/load';

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

  // NOTE: on web, load.js reads `process.env.EXPO_PUBLIC_FIREBASE_CONFIG` which
  // babel-preset-expo inlines at compile time. In the test environment that value is
  // `undefined`, so we can't directly call loadFirebaseAnalytics with Platform.OS='web'.
  // Instead, we verify the code path by stubbing setReactNativeAsyncStorage and proving
  // it is invoked when the function is called on web (before the JSON.parse failure).
  it('on web, invokes setReactNativeAsyncStorage before failing on missing env config', async () => {
    global.Platform.OS = 'web';
    // The function will throw because EXPO_PUBLIC_FIREBASE_CONFIG is inlined as undefined
    // in test builds, but setReactNativeAsyncStorage runs first.
    await expect(loadFirebaseAnalytics()).rejects.toThrow();
    expect(firebase.setReactNativeAsyncStorage).toHaveBeenCalled();
  });
});
