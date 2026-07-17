jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: { font: { ionicon: 'mock-font' } } }));

jest.mock('@/utils/firebase/load', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/audio/Sounds', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/prayer/PrayerCountdownService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/notifications/NotificationService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/prayer/PrayerNotificationScheduler', () => ({
  __esModule: true,
  default: { initialize: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/prayer/PrayerWidgetService', () => ({
  syncWidgetData: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/locales/i18n', () => ({
  initializeLanguage: jest.fn(() => Promise.resolve()),
}));

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import loadFirebaseAnalytics from '@/utils/firebase/load';
import Sounds from '@/utils/audio/Sounds';
import PrayerCountdownService from '@/utils/prayer/PrayerCountdownService';
import { syncWidgetData } from '@/utils/prayer/PrayerWidgetService';
import { initializeLanguage } from '@/locales/i18n';
import { loadAzkar } from '@/utils/azkar/AzkarStore';
import { loadResourcesAndDataAsync } from '@/utils/load';

describe('loadResourcesAndDataAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents splash auto-hide and loads fonts', async () => {
    await loadResourcesAndDataAsync();
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
    expect(Font.loadAsync).toHaveBeenCalled();
  });

  it('initializes firebase and prayer countdown', async () => {
    await loadResourcesAndDataAsync();
    expect(loadFirebaseAnalytics).toHaveBeenCalled();
    expect(PrayerCountdownService.initialize).toHaveBeenCalled();
  });

  it('syncs widget data on boot', async () => {
    await loadResourcesAndDataAsync();
    expect(syncWidgetData).toHaveBeenCalled();
  });

  it('does not eagerly initialize Sounds at boot (lazy on first use)', async () => {
    await loadResourcesAndDataAsync();
    expect(Sounds.initialize).not.toHaveBeenCalled();
  });

  it('initializes language as part of the finally block', async () => {
    await loadResourcesAndDataAsync();
    expect(initializeLanguage).toHaveBeenCalled();
  });

  it('loads the Azkar list as part of the finally block', async () => {
    await loadResourcesAndDataAsync();
    expect(loadAzkar).toHaveBeenCalled();
  });

  it('returns true on success', async () => {
    await expect(loadResourcesAndDataAsync()).resolves.toBe(true);
  });

  it('does not let PrayerCountdownService.initialize failure abort startup', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    PrayerCountdownService.initialize.mockRejectedValueOnce(new Error('countdown failed'));
    await expect(loadResourcesAndDataAsync()).resolves.toBe(true);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('warns and still runs the finally block when font loading fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Font.loadAsync.mockRejectedValueOnce(new Error('no font'));
    await loadResourcesAndDataAsync();
    expect(warnSpy).toHaveBeenCalled();
    // The finally block should still have run
    expect(initializeLanguage).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
