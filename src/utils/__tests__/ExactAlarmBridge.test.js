import { Platform } from 'react-native';

const mockNative = { canScheduleExactAlarms: jest.fn() };
jest.mock('expo-modules-core', () => ({ requireOptionalNativeModule: jest.fn(() => mockNative) }));
import { requireOptionalNativeModule } from 'expo-modules-core';

function loadBridge() {
  let bridge;
  jest.isolateModules(() => { bridge = require('../../../modules/expo-exact-alarm/index.js'); });
  return bridge;
}

beforeEach(() => { jest.clearAllMocks(); requireOptionalNativeModule.mockReturnValue(mockNative); });
afterEach(() => { Platform.OS = 'ios'; Platform.Version = undefined; });

it.each([true, false])('returns the native exact-alarm permission: %s', allowed => {
  Platform.OS = 'android';
  Platform.Version = 34;
  mockNative.canScheduleExactAlarms.mockReturnValue(allowed);
  expect(loadBridge().canScheduleExactAlarms()).toBe(allowed);
  expect(requireOptionalNativeModule).toHaveBeenCalledWith('ExpoExactAlarm');
});

it('fails closed on an old Android client without the native bridge', () => {
  Platform.OS = 'android';
  Platform.Version = 34;
  requireOptionalNativeModule.mockReturnValue(null);
  expect(loadBridge().canScheduleExactAlarms()).toBe(false);
});

it.each([['android', 30], ['ios', 18], ['web', undefined]])('needs no special access on %s %s', (os, version) => {
  Platform.OS = os;
  Platform.Version = version;
  expect(loadBridge().canScheduleExactAlarms()).toBe(true);
  expect(mockNative.canScheduleExactAlarms).not.toHaveBeenCalled();
});
