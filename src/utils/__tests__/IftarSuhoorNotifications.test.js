jest.mock('@/locales/i18n', () => ({ t: (k) => k }));

jest.mock('@/utils/notifications/NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleExactNotification: jest.fn().mockResolvedValue('id'),
    cancelNotification: jest.fn().mockResolvedValue(),
    getScheduledNotifications: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/utils/prayer/PrayerUtils', () => ({
  calculatePrayerTimes: jest.fn(),
}));
jest.mock('@/utils/calendar/FastingTracker', () => ({ loadFastingDays: jest.fn() }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import notificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { loadFastingDays } from '@/utils/calendar/FastingTracker';
import { scheduleFastDayNotifications, cancelFastDayNotifications, refreshFastDayNotifications } from '@/utils/calendar/IftarSuhoorNotifications';

describe('IftarSuhoorNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.scheduleExactNotification.mockResolvedValue('id');
    notificationService.cancelNotification.mockResolvedValue();
    notificationService.getScheduledNotifications.mockResolvedValue([]);
    loadFastingDays.mockResolvedValue({});
  });

  it('does nothing when no prayer location is saved', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const result = await scheduleFastDayNotifications(new Date());
    expect(result).toBe(false);
    expect(notificationService.scheduleExactNotification).not.toHaveBeenCalled();
  });

  it('schedules suhoor and iftar notifications using the saved location', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION) {
        return Promise.resolve(JSON.stringify({ latitude: 21.4, longitude: 39.8, timezone: 'Asia/Riyadh' }));
      }
      return Promise.resolve(null);
    });

    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    calculatePrayerTimes.mockReturnValue({
      fajr: moment(future).clone(),
      maghrib: moment(future).clone().add(12, 'hours'),
    });

    const result = await scheduleFastDayNotifications(future);
    expect(result).toBe(true);
    expect(notificationService.scheduleExactNotification).toHaveBeenCalledTimes(2);
  });

  it('cancelFastDayNotifications cancels both suhoor and iftar notifications', async () => {
    await cancelFastDayNotifications(new Date(2026, 1, 18));
    expect(notificationService.cancelNotification).toHaveBeenCalledWith('suhoor-2026-02-18');
    expect(notificationService.cancelNotification).toHaveBeenCalledWith('iftar-2026-02-18');
  });

  it('reports a partially scheduled fasting day instead of claiming both reminders succeeded', async () => {
    AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION
      ? JSON.stringify({ latitude: 21.4, longitude: 39.8 }) : null);
    const future = moment().add(1, 'day');
    calculatePrayerTimes.mockReturnValue({ fajr: future, maghrib: future.clone().add(12, 'hours') });
    notificationService.scheduleExactNotification.mockResolvedValueOnce('suhoor').mockResolvedValueOnce(null);
    expect(await scheduleFastDayNotifications(future.toDate())).toBe(false);
  });

  it('preserves existing reminders when prayer calculations return invalid times', async () => {
    AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION
      ? JSON.stringify({ latitude: 89, longitude: 0 }) : null);
    calculatePrayerTimes.mockReturnValue({ fajr: moment.invalid(), maghrib: moment.invalid() });
    expect(await scheduleFastDayNotifications(new Date())).toBe(false);
    expect(notificationService.cancelNotification).not.toHaveBeenCalled();
    expect(notificationService.scheduleExactNotification).not.toHaveBeenCalled();
  });

  it('retimes queued fasting reminders with the updated location and removes a now-past suhoor', async () => {
    AsyncStorage.getItem.mockImplementation(async key => ({
      [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 51.5, longitude: -0.12, timezone: 'Africa/Cairo' }),
      [ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    }[key] ?? null));
    const key = moment().locale('en').format('YYYY-MM-DD');
    loadFastingDays.mockResolvedValue({ [key]: 1 });
    notificationService.getScheduledNotifications.mockResolvedValue([
      { identifier: `suhoor-${key}` }, { identifier: `iftar-${key}` }, { identifier: 'prayer-fajr-other' },
    ]);
    const maghrib = moment().add(2, 'hours');
    calculatePrayerTimes.mockReturnValue({ fajr: moment().subtract(1, 'hour'), maghrib });
    expect(await refreshFastDayNotifications()).toBe(true);
    expect(calculatePrayerTimes).toHaveBeenCalledWith(51.5, -0.12, 'Europe/London', expect.any(Date), expect.any(String), expect.any(String));
    expect(calculatePrayerTimes).toHaveBeenCalledTimes(1);
    expect(notificationService.cancelNotification.mock.calls).toEqual([[`suhoor-${key}`]]);
    expect(notificationService.scheduleExactNotification).toHaveBeenCalledWith(`iftar-${key}`, expect.any(String), expect.any(String), maghrib.toDate(), 'short');
  });

  it('cancels only fasting reminders when that feature is disabled', async () => {
    AsyncStorage.getItem.mockResolvedValue('false');
    notificationService.getScheduledNotifications.mockResolvedValue([
      { identifier: 'suhoor-2026-11-01' }, { identifier: 'iftar-2026-11-01' }, { identifier: 'prayer-fajr-20261101' },
    ]);
    expect(await refreshFastDayNotifications()).toBe(true);
    expect(notificationService.cancelNotification.mock.calls).toEqual([['suhoor-2026-11-01'], ['iftar-2026-11-01']]);
  });

  it('reports an unreadable queue without cancelling existing reminders', async () => {
    notificationService.getScheduledNotifications.mockRejectedValue(new Error('unavailable'));
    expect(await refreshFastDayNotifications()).toBe(false);
    expect(notificationService.cancelNotification).not.toHaveBeenCalled();
    expect(notificationService.scheduleExactNotification).not.toHaveBeenCalled();
  });

  it('removes orphan reminders for unmarked days and preserves them when history cannot be read', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    notificationService.getScheduledNotifications.mockResolvedValue([{ identifier: 'iftar-2026-11-01' }]);
    loadFastingDays.mockRejectedValueOnce(new Error('history unavailable'));
    expect(await refreshFastDayNotifications()).toBe(false);
    expect(notificationService.cancelNotification).not.toHaveBeenCalled();
    expect(await refreshFastDayNotifications()).toBe(true);
    expect(notificationService.cancelNotification.mock.calls).toEqual([['suhoor-2026-11-01'], ['iftar-2026-11-01']]);
    expect(notificationService.scheduleExactNotification).not.toHaveBeenCalled();
  });

  it('finishes a background refresh before cancelling that fasting day', async () => {
    AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION
      ? JSON.stringify({ latitude: 21.4, longitude: 39.8 }) : 'true');
    const future = moment().add(1, 'day');
    const key = future.clone().locale('en').format('YYYY-MM-DD');
    loadFastingDays.mockResolvedValue({ [key]: 1 });
    notificationService.getScheduledNotifications.mockResolvedValue([{ identifier: `iftar-${key}` }]);
    calculatePrayerTimes.mockReturnValue({ fajr: future, maghrib: future.clone().add(12, 'hours') });
    let release;
    let started;
    const entered = new Promise(resolve => { started = resolve; });
    notificationService.scheduleExactNotification.mockImplementationOnce(() => {
      started();
      return new Promise(resolve => { release = () => resolve('suhoor'); });
    });
    const refresh = refreshFastDayNotifications();
    await entered;
    const cancel = cancelFastDayNotifications(future.toDate());
    expect(notificationService.cancelNotification).not.toHaveBeenCalled();
    release();
    await Promise.all([refresh, cancel]);
    expect(notificationService.cancelNotification.mock.calls).toEqual([[`suhoor-${key}`], [`iftar-${key}`]]);
    expect(notificationService.cancelNotification.mock.invocationCallOrder[0]).toBeGreaterThan(notificationService.scheduleExactNotification.mock.invocationCallOrder.at(-1));
  });
});
