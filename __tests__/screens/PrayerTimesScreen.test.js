jest.mock('../../locales/i18n', () => ({
  t: (k) => k,
  getDirectionalMixedSpacing: () => ({}),
  getRTLTextAlign: () => 'left',
  formatArabicTime: (m) => (m ? m.format('h:mm A') : ''),
  formatArabicCountdown: (s) => s,
  formatArabicDate: (d) => d.format('YYYY-MM-DD'),
  isRTL: () => false,
}));

jest.mock('../../components/CHeader', () => () => null);

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrayerTimesScreen from '../../screens/PrayerTimesScreen';
import { PRAYER_CONSTANTS } from '../../constants/PrayerConstants';

const LOC = JSON.stringify({
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
  city: 'New York',
  country: 'USA',
});

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn(() => jest.fn()) });

describe('PrayerTimesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when all settings are present', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION) return Promise.resolve(LOC);
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD)
        return Promise.resolve('MuslimWorldLeague');
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB) return Promise.resolve('Shafi');
      return Promise.resolve(null);
    });
    const navigation = buildNav();
    const { toJSON } = render(<PrayerTimesScreen navigation={navigation} />);
    await waitFor(() => expect(toJSON()).toBeTruthy());
  });

  it('redirects to UnifiedPrayerSettings when location is not set', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const navigation = buildNav();
    render(<PrayerTimesScreen navigation={navigation} />);
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('UnifiedPrayerSettings');
    });
  });

  it('opens the prayer history sheet from the one-line trigger', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION) return Promise.resolve(LOC);
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD)
        return Promise.resolve('MuslimWorldLeague');
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB) return Promise.resolve('Shafi');
      return Promise.resolve(null);
    });
    const navigation = buildNav();
    const { getByTestId, queryByTestId } = render(<PrayerTimesScreen navigation={navigation} />);
    await waitFor(() => expect(getByTestId('prayer-history-trigger')).toBeTruthy());

    expect(queryByTestId('prayer-history-sheet')).toBeNull();
    fireEvent.press(getByTestId('prayer-history-trigger'));
    await waitFor(() => expect(getByTestId('prayer-history-sheet')).toBeTruthy());
  });

  it('does not crash on storage error', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
    const navigation = buildNav();
    const { toJSON } = render(<PrayerTimesScreen navigation={navigation} />);
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
    errSpy.mockRestore();
  });
});
