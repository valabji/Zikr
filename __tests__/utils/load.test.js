jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: { font: { ionicon: 'mock-font' } } }));

jest.mock('../../utils/firebase/load', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/Sounds', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../utils/PrayerCountdownService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../utils/NotificationService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../utils/PrayerNotificationScheduler', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../utils/PrayerWidgetService', () => ({
  syncWidgetData: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../locales/i18n', () => ({
  initializeLanguage: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../constants/Azkar.json', () => [{ id: 1, name: 'sample' }], { virtual: false });

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import loadFirebaseAnalytics from '../../utils/firebase/load';
import Sounds from '../../utils/Sounds';
import PrayerCountdownService from '../../utils/PrayerCountdownService';
import { syncWidgetData } from '../../utils/PrayerWidgetService';
import { initializeLanguage } from '../../locales/i18n';
import { mystore } from '../../redux/store';
import { loadResourcesAndDataAsync } from '../../utils/load';

describe('loadResourcesAndDataAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents splash auto-hide and loads fonts', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    await loadResourcesAndDataAsync();
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
    expect(Font.loadAsync).toHaveBeenCalled();
  });

  it('initializes firebase and prayer countdown', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    await loadResourcesAndDataAsync();
    expect(loadFirebaseAnalytics).toHaveBeenCalled();
    expect(PrayerCountdownService.initialize).toHaveBeenCalled();
  });

  it('syncs widget data on boot', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    await loadResourcesAndDataAsync();
    expect(syncWidgetData).toHaveBeenCalled();
  });

  it('does not eagerly initialize Sounds at boot (lazy on first use)', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    await loadResourcesAndDataAsync();
    expect(Sounds.initialize).not.toHaveBeenCalled();
  });

  it('initializes language as part of the finally block', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    await loadResourcesAndDataAsync();
    expect(initializeLanguage).toHaveBeenCalled();
  });

  it('dispatches Azkar from default JSON when nothing is stored', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await loadResourcesAndDataAsync();
    expect(mystore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'change',
        obj: expect.objectContaining({ Azkar: expect.any(Array) }),
      })
    );
  });

  it('dispatches stored Azkar from AsyncStorage when present', async () => {
    const stored = [{ id: 99, name: 'persisted' }];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(stored));
    await loadResourcesAndDataAsync();
    const dispatched = mystore.dispatch.mock.calls.at(-1)[0];
    expect(dispatched.obj.Azkar).toEqual(stored);
  });

  it('returns true on success', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await expect(loadResourcesAndDataAsync()).resolves.toBe(true);
  });

  it('does not let PrayerCountdownService.initialize failure abort startup', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    PrayerCountdownService.initialize.mockRejectedValueOnce(new Error('countdown failed'));
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await expect(loadResourcesAndDataAsync()).resolves.toBe(true);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('warns and still runs the finally block when font loading fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Font.loadAsync.mockRejectedValueOnce(new Error('no font'));
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await loadResourcesAndDataAsync();
    expect(warnSpy).toHaveBeenCalled();
    // The finally block should still have run
    expect(initializeLanguage).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
