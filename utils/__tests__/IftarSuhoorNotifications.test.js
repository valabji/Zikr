jest.mock('../../locales/i18n', () => ({ t: (k) => k }));

jest.mock('../NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleExactNotification: jest.fn().mockResolvedValue('id'),
    cancelNotification: jest.fn().mockResolvedValue(),
  },
}));

jest.mock('../PrayerUtils', () => ({
  calculatePrayerTimes: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import notificationService from '../NotificationService';
import { calculatePrayerTimes } from '../PrayerUtils';
import { PRAYER_CONSTANTS } from '../../constants/PrayerConstants';
import { scheduleFastDayNotifications, cancelFastDayNotifications } from '../IftarSuhoorNotifications';

describe('IftarSuhoorNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
