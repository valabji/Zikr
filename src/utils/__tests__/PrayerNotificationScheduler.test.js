import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import scheduler from '@/utils/prayer/PrayerNotificationScheduler';
import NotificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

jest.mock('@/utils/notifications/NotificationService', () => ({ __esModule: true, default: {
  scheduleExactNotification: jest.fn(), cancelNotification: jest.fn().mockResolvedValue(),
} }));
jest.mock('@/utils/prayer/PrayerUtils', () => ({ calculatePrayerTimes: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  scheduler.scheduledIds = [];
  AsyncStorage.getItem.mockImplementation(key => Promise.resolve({
    [PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED]: 'true',
    [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: JSON.stringify({ latitude: 30, longitude: 31, timezone: 'Africa/Cairo' }),
  }[key] ?? null));
  AsyncStorage.setItem.mockResolvedValue();
  AsyncStorage.removeItem.mockResolvedValue();
  calculatePrayerTimes.mockImplementation(() => ({ fajr: moment().add(1, 'hour') }));
  NotificationService.scheduleExactNotification.mockImplementation(async id => id);
});

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
  expect(NotificationService.cancelNotification).toHaveBeenCalledTimes(3);
});

it('uses default enabled prayers for malformed persisted null', async () => {
  const read = AsyncStorage.getItem.getMockImplementation();
  AsyncStorage.getItem.mockImplementation(key => key === PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS ? Promise.resolve('null') : read(key));
  await scheduler.scheduleAll();
  expect(NotificationService.scheduleExactNotification).toHaveBeenCalledTimes(3);
});
