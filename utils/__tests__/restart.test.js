jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(),
}));

import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';
import { Restart } from '../restart';

describe('Restart', () => {
  let originalDev;
  let originalLocation;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDev = global.__DEV__;
    originalLocation = global.window?.location;
  });

  afterEach(() => {
    global.__DEV__ = originalDev;
    if (originalLocation) {
      global.window = global.window || {};
      global.window.location = originalLocation;
    }
    global.Platform.OS = 'ios';
  });

  it('reloads the browser on web', () => {
    global.Platform.OS = 'web';
    const reload = jest.fn();
    global.window = { location: { reload } };
    Restart();
    expect(reload).toHaveBeenCalled();
  });

  it('uses DevSettings.reload in dev mode on native', () => {
    global.Platform.OS = 'ios';
    global.__DEV__ = true;
    Restart();
    expect(DevSettings.reload).toHaveBeenCalled();
  });

  it('uses Updates.reloadAsync in prod on native', () => {
    global.Platform.OS = 'android';
    global.__DEV__ = false;
    Restart();
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });
});
