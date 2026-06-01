jest.mock('../NotificationService', () => ({
  __esModule: true,
  default: {
    showPersistentCountdown: jest.fn().mockResolvedValue(undefined),
    hidePersistentCountdown: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../PrayerUtils', () => {
  const moment = require('moment-timezone');
  return {
    calculatePrayerTimes: jest.fn(),
    getCurrentAndNextPrayer: jest.fn(),
    getTimeUntilNextPrayer: jest.fn(),
    formatPrayerTime: jest.fn((m) => (m ? m.format('h:mm A') : '')),
    __moment: moment,
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../NotificationService';
import * as PrayerUtils from '../PrayerUtils';
import service from '../PrayerCountdownService';
import { PRAYER_CONSTANTS } from '../../constants/PrayerConstants';
import moment from 'moment-timezone';

const LOCATION = {
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
};

describe('PrayerCountdownService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Ensure clean state between tests — stop interval if any was started
    if (service.isServiceRunning()) {
      await service.stop();
    }
  });

  describe('initialize()', () => {
    it('does nothing when @persistent_countdown is not "true"', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await service.initialize();
      expect(service.isServiceRunning()).toBe(false);
    });

    it('starts the service when @persistent_countdown is "true"', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('true') // @persistent_countdown
        .mockResolvedValueOnce(JSON.stringify(LOCATION)) // LOCATION
        .mockResolvedValueOnce('MuslimWorldLeague') // CALCULATION_METHOD
        .mockResolvedValueOnce('Shafi'); // MADHAB
      PrayerUtils.calculatePrayerTimes.mockReturnValue({
        fajr: moment().add(2, 'hour'),
      });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({
        next: { name: 'fajr', time: moment().add(2, 'hour') },
      });
      PrayerUtils.getTimeUntilNextPrayer.mockReturnValue('2h 0m');

      await service.initialize();
      expect(service.isServiceRunning()).toBe(true);
      await service.stop();
    });

    it('catches storage errors gracefully', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      await expect(service.initialize()).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('start()', () => {
    it('does nothing if already running', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('MuslimWorldLeague')
        .mockResolvedValueOnce('Shafi');
      PrayerUtils.calculatePrayerTimes.mockReturnValue({ fajr: moment().add(1, 'hour') });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({
        next: { name: 'fajr', time: moment().add(1, 'hour') },
      });
      PrayerUtils.getTimeUntilNextPrayer.mockReturnValue('1h 0m');
      await service.start();
      const initialCallCount = NotificationService.showPersistentCountdown.mock.calls.length;
      await service.start(); // second call should be a no-op
      expect(NotificationService.showPersistentCountdown.mock.calls.length).toBe(initialCallCount);
      await service.stop();
    });

    it('does not start when there is no location set', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(null) // location
        .mockResolvedValueOnce(null) // calc method
        .mockResolvedValueOnce(null); // madhab
      await service.start();
      expect(service.isServiceRunning()).toBe(false);
      expect(NotificationService.showPersistentCountdown).not.toHaveBeenCalled();
    });

    it('updates countdown immediately on start and again on interval tick', async () => {
      jest.useFakeTimers();
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('MuslimWorldLeague')
        .mockResolvedValueOnce('Shafi');
      PrayerUtils.calculatePrayerTimes.mockReturnValue({ fajr: moment().add(1, 'hour') });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({
        next: { name: 'fajr', time: moment().add(1, 'hour') },
      });
      PrayerUtils.getTimeUntilNextPrayer.mockReturnValue('1h 0m');

      await service.start();
      expect(NotificationService.showPersistentCountdown).toHaveBeenCalledTimes(1);

      // Tick interval forward 60s — should trigger another updateCountdown
      await jest.advanceTimersByTimeAsync(60_000);
      expect(NotificationService.showPersistentCountdown).toHaveBeenCalledTimes(2);

      await service.stop();
      jest.useRealTimers();
    });

    it('rolls back isRunning flag if start throws', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      await service.start();
      expect(service.isServiceRunning()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('stop()', () => {
    it('clears the interval, flips isRunning, and hides notification', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('MuslimWorldLeague')
        .mockResolvedValueOnce('Shafi');
      PrayerUtils.calculatePrayerTimes.mockReturnValue({ fajr: moment().add(1, 'hour') });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({
        next: { name: 'fajr', time: moment().add(1, 'hour') },
      });
      PrayerUtils.getTimeUntilNextPrayer.mockReturnValue('1h 0m');

      await service.start();
      expect(service.isServiceRunning()).toBe(true);
      await service.stop();
      expect(service.isServiceRunning()).toBe(false);
      expect(NotificationService.hidePersistentCountdown).toHaveBeenCalled();
    });

    it('is a no-op when not running', async () => {
      await service.stop();
      expect(NotificationService.hidePersistentCountdown).toHaveBeenCalled();
    });
  });

  describe('updateCountdown()', () => {
    it('skips when calculatePrayerTimes returns null', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      PrayerUtils.calculatePrayerTimes.mockReturnValue(null);
      await service.updateCountdown(LOCATION, 'MuslimWorldLeague', 'Shafi');
      expect(NotificationService.showPersistentCountdown).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('skips when there is no next prayer', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      PrayerUtils.calculatePrayerTimes.mockReturnValue({ fajr: moment() });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({ next: null });
      await service.updateCountdown(LOCATION, 'MuslimWorldLeague', 'Shafi');
      expect(NotificationService.showPersistentCountdown).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('calls showPersistentCountdown with formatted name + time + remaining', async () => {
      const t = moment().add(1, 'hour');
      PrayerUtils.calculatePrayerTimes.mockReturnValue({ fajr: t });
      PrayerUtils.getCurrentAndNextPrayer.mockReturnValue({ next: { name: 'fajr', time: t } });
      PrayerUtils.getTimeUntilNextPrayer.mockReturnValue('1h 0m');

      await service.updateCountdown(LOCATION, 'MuslimWorldLeague', 'Shafi');
      expect(NotificationService.showPersistentCountdown).toHaveBeenCalledWith(
        'Fajr',
        expect.any(String),
        '1h 0m',
        'Next Prayer'
      );
    });

    it('recalculates for tomorrow when there is no time remaining today', async () => {
      const past = moment().subtract(1, 'hour');
      const tomorrowFajr = moment().add(1, 'day').hour(5);
      PrayerUtils.calculatePrayerTimes
        .mockReturnValueOnce({ fajr: past }) // today
        .mockReturnValueOnce({ fajr: tomorrowFajr }); // tomorrow
      PrayerUtils.getCurrentAndNextPrayer
        .mockReturnValueOnce({ next: { name: 'fajr', time: past } }) // today
        .mockReturnValueOnce({ next: { name: 'fajr', time: tomorrowFajr } }); // tomorrow
      PrayerUtils.getTimeUntilNextPrayer
        .mockReturnValueOnce('') // today (none remaining)
        .mockReturnValueOnce('8h 0m'); // tomorrow

      await service.updateCountdown(LOCATION, 'MuslimWorldLeague', 'Shafi');
      expect(NotificationService.showPersistentCountdown).toHaveBeenCalledWith(
        'Fajr',
        expect.any(String),
        '8h 0m',
        'Next Prayer'
      );
    });

    it('logs errors thrown inside updateCountdown without bubbling', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      PrayerUtils.calculatePrayerTimes.mockImplementation(() => {
        throw new Error('boom');
      });
      await expect(
        service.updateCountdown(LOCATION, 'MuslimWorldLeague', 'Shafi')
      ).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('getPrayerName()', () => {
    it.each([
      ['fajr', 'Fajr'],
      ['dhuhr', 'Dhuhr'],
      ['asr', 'Asr'],
      ['maghrib', 'Maghrib'],
      ['isha', 'Isha'],
    ])('maps %s -> %s', (key, name) => {
      expect(service.getPrayerName(key)).toBe(name);
    });

    it('returns the raw key when it is unknown', () => {
      expect(service.getPrayerName('unknown-prayer')).toBe('unknown-prayer');
    });
  });

  describe('getLocation / getCalculationMethod / getMadhab', () => {
    it('returns parsed location object', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(LOCATION));
      const loc = await service.getLocation();
      expect(loc).toEqual(LOCATION);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    });

    it('returns null if location is not set', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await expect(service.getLocation()).resolves.toBeNull();
    });

    it('returns null and logs on storage error for location', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      await expect(service.getLocation()).resolves.toBeNull();
      spy.mockRestore();
    });

    it('returns stored calculation method or default', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('Egyptian');
      await expect(service.getCalculationMethod()).resolves.toBe('Egyptian');
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await expect(service.getCalculationMethod()).resolves.toBe(
        PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD
      );
    });

    it('falls back to default calculation method on storage error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      await expect(service.getCalculationMethod()).resolves.toBe(
        PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD
      );
      spy.mockRestore();
    });

    it('returns stored madhab or default', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('Hanafi');
      await expect(service.getMadhab()).resolves.toBe('Hanafi');
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await expect(service.getMadhab()).resolves.toBe(PRAYER_CONSTANTS.DEFAULT_MADHAB);
    });

    it('falls back to default madhab on storage error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      await expect(service.getMadhab()).resolves.toBe(PRAYER_CONSTANTS.DEFAULT_MADHAB);
      spy.mockRestore();
    });
  });
});
