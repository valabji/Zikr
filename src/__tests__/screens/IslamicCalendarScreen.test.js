jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: (k, params) => (params ? `${k}:${JSON.stringify(params)}` : k),
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
}));

jest.mock('@/components/CustomHeader', () => () => null);

jest.mock('@/utils/notifications/NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleExactNotification: jest.fn().mockResolvedValue('id'),
    cancelNotification: jest.fn().mockResolvedValue(),
  },
}));

jest.mock('@/utils/prayer/PrayerUtils', () => ({
  calculatePrayerTimes: jest.fn(),
}));

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicCalendarScreen from '@/screens/IslamicCalendarScreen';
import { _resetForTests } from '@/utils/calendar/FastingTracker';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import notificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn(() => () => {}) });

describe('IslamicCalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTests();
    AsyncStorage.getItem.mockResolvedValue(null);
    notificationService.scheduleExactNotification.mockResolvedValue('id');
    notificationService.cancelNotification.mockResolvedValue();
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

  it('warns when reminders for a newly marked fasting day cannot be scheduled', async () => {
    AsyncStorage.getItem.mockImplementation(async key => ({
      [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 21.4, longitude: 39.8 }),
      [ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    }[key] ?? null));
    const future = moment().add(1, 'day');
    calculatePrayerTimes.mockReturnValue({ fajr: future, maghrib: future.clone().add(12, 'hours') });
    notificationService.scheduleExactNotification.mockResolvedValue(null);
    const screen = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await act(async () => {});
    fireEvent.press(screen.getByTestId('toggle-fasting-button'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('common.error', 'islamicCalendar.remindersError'));
  });

  it('waits for a fasting reminder update before accepting another toggle', async () => {
    AsyncStorage.getItem.mockImplementation(async key => ({
      [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 21.4, longitude: 39.8 }),
      [ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    }[key] ?? null));
    const future = moment().add(1, 'day');
    calculatePrayerTimes.mockReturnValue({ fajr: future, maghrib: future.clone().add(12, 'hours') });
    let finish;
    notificationService.scheduleExactNotification.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const screen = render(<IslamicCalendarScreen navigation={buildNav()} />);
    await act(async () => {});
    fireEvent.press(screen.getByTestId('toggle-fasting-button'));
    await waitFor(() => expect(notificationService.scheduleExactNotification).toHaveBeenCalled());
    expect(screen.getByTestId('toggle-fasting-button')).toBeDisabled();
    expect(screen.getByTestId('toggle-reminders-button')).toBeDisabled();
    await act(async () => { finish('id'); });
    expect(screen.getByTestId('toggle-fasting-button')).toBeEnabled();
    fireEvent.press(screen.getByTestId('toggle-fasting-button'));
    await waitFor(() => expect(notificationService.cancelNotification).toHaveBeenCalledTimes(2));
  });

  it('keeps changes disabled after a failed settings read, then reloads on focus', async () => {
    AsyncStorage.getItem.mockRejectedValue(new Error('unavailable'));
    const navigation = buildNav();
    const screen = render(<IslamicCalendarScreen navigation={navigation} />);
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('common.error', 'common.settingsLoadError'));
    expect(screen.getByTestId('toggle-reminders-button')).toBeDisabled();
    expect(screen.getByTestId('toggle-fasting-button')).toBeDisabled();
    AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION
      ? JSON.stringify({ latitude: 21.4, longitude: 39.8 }) : null);
    const onFocus = navigation.addListener.mock.calls.find(([event]) => event === 'focus')[1];
    await act(async () => { await onFocus(); });
    expect(screen.getByTestId('toggle-reminders-button')).toBeEnabled();
    fireEvent.press(screen.getByTestId('toggle-reminders-button'));
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith(ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true'));
  });
});
