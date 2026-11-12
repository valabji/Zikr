import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import scheduler, { PRAYER_REFRESH_TASK } from '@/utils/prayer/PrayerNotificationScheduler';
import NotificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { refreshFastDayNotifications } from '@/utils/calendar/IftarSuhoorNotifications';

jest.mock('@/utils/notifications/NotificationService', () => ({ __esModule: true, default: {
  scheduleExactNotification: jest.fn(), cancelNotification: jest.fn().mockResolvedValue(),
  getScheduledNotifications: jest.fn().mockResolvedValue([]), initializeChannels: jest.fn().mockResolvedValue(),
} }));
jest.mock('@/utils/prayer/PrayerUtils', () => ({ calculatePrayerTimes: jest.fn() }));
jest.mock('@/utils/calendar/IftarSuhoorNotifications', () => ({ refreshFastDayNotifications: jest.fn().mockResolvedValue(true) }));
jest.mock('@/locales/i18n', () => ({ t: key => key, initializeLanguage: jest.fn().mockResolvedValue() }));

const backgroundRefresh = TaskManager.defineTask.mock.calls.find(([name]) => name === PRAYER_REFRESH_TASK)[1];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-07-01T00:00:00Z'));
  Platform.OS = 'ios';
  scheduler.scheduledIds = [];
  scheduler.operations = Promise.resolve();
  AsyncStorage.getItem.mockImplementation(key => Promise.resolve({
    [PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 30, longitude: 31, timezone: 'Africa/Cairo' }),
  }[key] ?? null));
  AsyncStorage.setItem.mockResolvedValue();
  AsyncStorage.removeItem.mockResolvedValue();
  calculatePrayerTimes.mockImplementation((lat, lon, zone, date) => ({
    fajr: moment.tz(`${moment(date).format('YYYY-MM-DD')} 05:00`, zone),
  }));
  NotificationService.getScheduledNotifications.mockResolvedValue([]);
  NotificationService.cancelNotification.mockResolvedValue();
  NotificationService.scheduleExactNotification.mockImplementation(async id => id);
  refreshFastDayNotifications.mockResolvedValue(true);
});

afterEach(() => { jest.useRealTimers(); Platform.OS = 'ios'; });

it('finishes cancelling an in-flight scheduling pass before resolving cancelAll', async () => {
  let release;
  let started;
  const entered = new Promise(resolve => { started = resolve; });
  NotificationService.scheduleExactNotification.mockImplementationOnce(id => {
    started();
    return new Promise(resolve => { release = () => resolve(id); });
  });
  const scheduling = scheduler.scheduleAll();
  await entered;
  const cancelling = scheduler.cancelAll();
  release();
  await Promise.all([scheduling, cancelling]);
  expect(scheduler.scheduledIds).toEqual([]);
  expect(NotificationService.cancelNotification).toHaveBeenCalledTimes(11);
});

it('uses default enabled prayers for malformed persisted null', async () => {
  const read = AsyncStorage.getItem.getMockImplementation();
  AsyncStorage.getItem.mockImplementation(key => key === PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS ? Promise.resolve('null') : read(key));
  await scheduler.scheduleAll();
  expect(NotificationService.scheduleExactNotification).toHaveBeenCalledTimes(11);
});

it.each([['ios', 10], ['android', 30]])('keeps %s reminders past day three and schedules renewal before expiry', async (platform, days) => {
  Platform.OS = platform;
  expect(await scheduler.initialize()).toBe(true);
  expect(BackgroundTask.registerTaskAsync).toHaveBeenCalledWith(PRAYER_REFRESH_TASK, { minimumInterval: 720 });
  const calls = NotificationService.scheduleExactNotification.mock.calls;
  const prayers = calls.filter(([id]) => id !== 'prayer-schedule-renewal');
  expect(prayers).toHaveLength(days);
  const last = prayers.at(-1)[3];
  expect(moment(last).tz('Africa/Cairo').date()).toBe(days);
  const renewal = calls.find(([id]) => id === 'prayer-schedule-renewal');
  expect(renewal[3].getTime()).toBe(last.getTime() - 86400000);
  expect(renewal[4]).toBe('none');
});

it('leaves room for other pending iOS notifications and the renewal reminder', async () => {
  NotificationService.getScheduledNotifications.mockResolvedValue(Array.from({ length: 60 }, (_, i) => ({ identifier: `iftar-${i}` })));
  await scheduler.scheduleAll();
  expect(NotificationService.scheduleExactNotification).toHaveBeenCalledTimes(4);
  expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
});

it('schedules all five prayers for the iOS window without exceeding its queue limit', async () => {
  calculatePrayerTimes.mockImplementation((lat, lon, zone, date) => Object.fromEntries(
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((name, index) => [name,
      moment.tz(`${moment(date).format('YYYY-MM-DD')} 05:00`, zone).add(index * 3, 'hours'),
    ]),
  ));
  expect(await scheduler.scheduleAll()).toBe(true);
  expect(NotificationService.scheduleExactNotification).toHaveBeenCalledTimes(51);
});

it('does not schedule or cancel anything when other iOS reminders fill the queue', async () => {
  NotificationService.getScheduledNotifications.mockResolvedValue(Array.from({ length: 64 }, (_, i) => ({ identifier: `iftar-${i}` })));
  expect(await scheduler.scheduleAll()).toBe(false);
  expect(NotificationService.scheduleExactNotification).not.toHaveBeenCalled();
  expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
});

it('refreshes the schedule from the background task without opening the app', async () => {
  expect(await backgroundRefresh({})).toBe(BackgroundTask.BackgroundTaskResult.Success);
  jest.setSystemTime(new Date('2026-07-05T00:00:00Z'));
  NotificationService.scheduleExactNotification.mockClear();
  expect(await backgroundRefresh({})).toBe(BackgroundTask.BackgroundTaskResult.Success);
  expect(NotificationService.scheduleExactNotification.mock.calls.some(([id]) => id === 'prayer-fajr-20260714')).toBe(true);
});

it('unregisters background refresh and cancels owned notifications when disabled', async () => {
  AsyncStorage.getItem.mockResolvedValue('false');
  NotificationService.getScheduledNotifications.mockResolvedValue([
    { identifier: 'prayer-fajr-20260701' }, { identifier: 'prayer-schedule-renewal' }, { identifier: 'iftar-20260701' },
  ]);
  expect(await scheduler.initialize()).toBe(true);
  expect(BackgroundTask.unregisterTaskAsync).toHaveBeenCalledWith(PRAYER_REFRESH_TASK);
  expect(NotificationService.cancelNotification.mock.calls.map(([id]) => id)).toEqual(['prayer-fajr-20260701', 'prayer-schedule-renewal']);
});

it('keeps the old schedule on a settings read failure and reports task failure', async () => {
  AsyncStorage.getItem.mockRejectedValue(new Error('storage unavailable'));
  expect(await backgroundRefresh({})).toBe(BackgroundTask.BackgroundTaskResult.Failed);
  expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
});

it.each(['prayer preferences', 'pending notifications'])('preserves the schedule when reading %s fails', async source => {
  if (source === 'prayer preferences') {
    const read = AsyncStorage.getItem.getMockImplementation();
    AsyncStorage.getItem.mockImplementation(key => key === PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS
      ? Promise.reject(new Error('read failed')) : read(key));
  } else {
    NotificationService.getScheduledNotifications.mockRejectedValue(new Error('read failed'));
  }
  expect(await scheduler.scheduleAll()).toBe(false);
  expect(NotificationService.scheduleExactNotification).not.toHaveBeenCalled();
  expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
});

it('reports partial scheduling failures so background work can retry', async () => {
  NotificationService.scheduleExactNotification.mockResolvedValue(null);
  expect(await backgroundRefresh({})).toBe(BackgroundTask.BackgroundTaskResult.Failed);
});

it('reports failed cancellation and retains its IDs for retry when reminders are disabled', async () => {
  AsyncStorage.getItem.mockResolvedValue('false');
  scheduler.scheduledIds = ['prayer-fajr-20260701'];
  NotificationService.cancelNotification.mockRejectedValue(new Error('unavailable'));
  expect(await scheduler.initialize()).toBe(false);
  expect(scheduler.scheduledIds).toEqual(['prayer-fajr-20260701']);
  expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
});

it('does not let a delayed disable erase a newer enabled schedule', async () => {
  const read = AsyncStorage.getItem.getMockImplementation();
  let enabled = false;
  AsyncStorage.getItem.mockImplementation(key => key === PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED
    ? Promise.resolve(String(enabled)) : read(key));
  let release;
  let started;
  const entered = new Promise(resolve => { started = resolve; });
  BackgroundTask.unregisterTaskAsync.mockImplementationOnce(() => {
    started();
    return new Promise(resolve => { release = resolve; });
  });
  const disabling = scheduler.refresh();
  await entered;
  enabled = true;
  const enabling = scheduler.refresh();
  await jest.advanceTimersByTimeAsync(0);
  release();
  await Promise.all([disabling, enabling]);
  expect(scheduler.scheduledIds).toHaveLength(11);
});

it('retimes fasting reminders on startup even when prayer reminders are disabled', async () => {
  refreshFastDayNotifications.mockImplementation(jest.requireActual('@/utils/calendar/IftarSuhoorNotifications').refreshFastDayNotifications);
  AsyncStorage.getItem.mockImplementation(async key => ({
    [PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'false',
    [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 51.5, longitude: -0.12, timezone: 'Africa/Cairo' }),
    [ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    [ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.FASTING_TRACKER]: '{"days":{"2026-07-01":1}}',
  }[key] ?? null));
  NotificationService.getScheduledNotifications.mockResolvedValue([{ identifier: 'iftar-2026-07-01' }]);
  calculatePrayerTimes.mockImplementation((lat, lon, zone, date) => ({
    fajr: moment(date).hour(5), maghrib: moment(date).hour(18),
  }));
  expect(await scheduler.initialize()).toBe(true);
  expect(calculatePrayerTimes).toHaveBeenCalledWith(51.5, -0.12, 'Europe/London', expect.any(Date), expect.any(String), expect.any(String));
  expect(NotificationService.scheduleExactNotification.mock.calls.map(([id]) => id)).toContain('iftar-2026-07-01');
});

it('still renews prayer reminders but reports failure if fasting reminders cannot be updated', async () => {
  refreshFastDayNotifications.mockResolvedValue(false);
  expect(await scheduler.initialize()).toBe(false);
  expect(NotificationService.scheduleExactNotification).toHaveBeenCalledTimes(11);
});
