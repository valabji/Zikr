jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: (k, params) => (params ? `${k}:${JSON.stringify(params)}` : k),
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
}));

jest.mock('@/components/CustomHeader', () => () => null);

jest.mock('@/utils/NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleExactNotification: jest.fn().mockResolvedValue('id'),
    cancelNotification: jest.fn().mockResolvedValue(),
  },
}));

jest.mock('@/utils/PrayerUtils', () => ({
  calculatePrayerTimes: jest.fn(),
}));

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicCalendarScreen from '@/screens/IslamicCalendarScreen';
import { _resetForTests } from '@/utils/FastingTracker';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn() });

describe('IslamicCalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTests();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await waitFor(() => expect(toJSON()).toBeTruthy());
  });

  it('toggles fasting for the selected (today) day', async () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const { getByTestId } = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('toggle-fasting-button')).toBeTruthy());

    fireEvent.press(getByTestId(`calendar-day-${todayKey}`));
    fireEvent.press(getByTestId('toggle-fasting-button'));
    fireEvent.press(getByTestId('toggle-fasting-button'));
  });

  it('shows an alert instead of enabling reminders when no location is saved', async () => {
    const { getByTestId } = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('toggle-reminders-button')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-reminders-button'));
    await waitFor(() => {
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED,
        'true'
      );
    });
  });

  it('enables reminders when a location is already saved', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION) {
        return Promise.resolve(JSON.stringify({ latitude: 21.4, longitude: 39.8, timezone: 'Asia/Riyadh' }));
      }
      return Promise.resolve(null);
    });
    const { getByTestId } = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('toggle-reminders-button')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-reminders-button'));
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED,
        'true'
      );
    });
  });

  it('navigates between Hijri months', async () => {
    const { getByTestId } = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('calendar-next-month')).toBeTruthy());
    fireEvent.press(getByTestId('calendar-next-month'));
    fireEvent.press(getByTestId('calendar-prev-month'));
  });
});
