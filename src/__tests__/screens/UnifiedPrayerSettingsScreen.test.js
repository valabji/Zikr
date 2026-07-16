jest.mock('@/locales/i18n', () => ({
  t: (k) => k,
  getDirectionalMixedSpacing: () => ({}),
  getRTLTextAlign: () => 'left',
  isRTL: () => false,
}));

jest.mock('@/components/CHeader', () => () => null);
jest.mock('@/components/CustomToggle', () => () => null);

jest.mock('@/utils/PrayerUtils', () => ({
  searchLocations: jest.fn().mockResolvedValue([]),
  getLocationFromIP: jest.fn(),
  getBrowserLocation: jest.fn(),
}));

jest.mock('@/utils/restart', () => ({ Restart: jest.fn() }));

jest.mock('@/utils/NotificationService', () => ({
  __esModule: true,
  default: {
    requestPermissions: jest.fn().mockResolvedValue({ granted: true, exactAlarmGranted: true }),
    checkExactAlarmPermission: jest.fn().mockResolvedValue(true),
    cancelAllNotifications: jest.fn().mockResolvedValue(),
    scheduleExactNotification: jest.fn().mockResolvedValue('id'),
    showPersistentCountdown: jest.fn().mockResolvedValue(),
    hidePersistentCountdown: jest.fn().mockResolvedValue(),
    openExactAlarmSettings: jest.fn().mockResolvedValue(),
    openBatterySettings: jest.fn().mockResolvedValue(),
  },
}));

jest.mock('@/utils/PrayerCountdownService', () => ({
  __esModule: true,
  default: {
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue(),
    isServiceRunning: jest.fn(() => false),
  },
}));

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  Accuracy: { Balanced: 3 },
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedPrayerSettingsScreen from '@/screens/UnifiedPrayerSettingsScreen';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn(() => jest.fn()) });

describe('UnifiedPrayerSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing with no stored settings', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const { toJSON } = render(<UnifiedPrayerSettingsScreen navigation={buildNav()} />);
    await waitFor(() => expect(toJSON()).toBeTruthy());
  });

  it('loads existing settings on mount', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION) {
        return Promise.resolve(JSON.stringify({ latitude: 40, longitude: -74, city: 'NYC', country: 'USA', timezone: 'America/New_York' }));
      }
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD) return Promise.resolve('Egyptian');
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB) return Promise.resolve('Hanafi');
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED) return Promise.resolve('true');
      return Promise.resolve(null);
    });
    const { toJSON } = render(<UnifiedPrayerSettingsScreen navigation={buildNav()} />);
    await waitFor(() => expect(toJSON()).toBeTruthy());
    // Verify storage was queried for the key list
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB);
    });
  });

  it('does not crash when loading settings fails', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
    const { toJSON } = render(<UnifiedPrayerSettingsScreen navigation={buildNav()} />);
    await waitFor(() => expect(toJSON()).toBeTruthy());
    errSpy.mockRestore();
  });
});
