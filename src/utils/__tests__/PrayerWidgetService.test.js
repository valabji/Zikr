jest.mock('@/utils/PrayerUtils', () => ({
  calculatePrayerTimes: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { requestWidgetUpdate } from 'react-native-android-widget';
import * as PrayerUtils from '@/utils/PrayerUtils';
import {
  buildWidgetSchedule,
  getWidgetPrayerData,
  syncWidgetData,
  WIDGET_APP_GROUP,
  WIDGET_DATA_KEY,
  WIDGET_THEME_KEY,
  WIDGET_LANGUAGE_KEY,
} from '@/utils/PrayerWidgetService';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

const LOCATION = {
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
  city: 'New York',
};

const makeTime = (hour) => ({
  toISOString: () => `2026-06-18T${String(hour).padStart(2, '0')}:00:00.000Z`,
});

const FULL_DAY = {
  fajr: makeTime(4),
  sunrise: makeTime(6),
  dhuhr: makeTime(12),
  asr: makeTime(15),
  maghrib: makeTime(19),
  isha: makeTime(21),
};

describe('PrayerWidgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildWidgetSchedule()', () => {
    it('returns null when calculatePrayerTimes fails', () => {
      PrayerUtils.calculatePrayerTimes.mockReturnValue(null);
      expect(buildWidgetSchedule(LOCATION, 'MuslimWorldLeague', 'Shafi')).toBeNull();
    });

    it('builds today\'s 5 prayers plus tomorrow\'s fajr, sorted', () => {
      PrayerUtils.calculatePrayerTimes
        .mockReturnValueOnce(FULL_DAY)
        .mockReturnValueOnce({ fajr: makeTime(4) });

      const result = buildWidgetSchedule(LOCATION, 'MuslimWorldLeague', 'Shafi');

      expect(result.city).toBe('New York');
      expect(result.prayers).toHaveLength(6);
      expect(result.prayers.map((p) => p.name)).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'fajr']);
      expect(result.updatedAt).toEqual(expect.any(String));
    });

    it('omits tomorrow\'s fajr when tomorrow calculation fails', () => {
      PrayerUtils.calculatePrayerTimes
        .mockReturnValueOnce(FULL_DAY)
        .mockReturnValueOnce(null);

      const result = buildWidgetSchedule(LOCATION, 'MuslimWorldLeague', 'Shafi');
      expect(result.prayers).toHaveLength(5);
    });
  });

  describe('getWidgetPrayerData()', () => {
    it('returns null when no location is saved', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const result = await getWidgetPrayerData();
      expect(result).toBeNull();
    });

    it('reads location/method/madhab from storage and builds a schedule', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('Egyptian')
        .mockResolvedValueOnce('Hanafi')
        .mockResolvedValueOnce('originalGreen');
      PrayerUtils.calculatePrayerTimes
        .mockReturnValueOnce(FULL_DAY)
        .mockReturnValueOnce({ fajr: makeTime(4) });

      const result = await getWidgetPrayerData();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB);
      expect(PrayerUtils.calculatePrayerTimes).toHaveBeenCalledWith(
        LOCATION.latitude,
        LOCATION.longitude,
        LOCATION.timezone,
        expect.any(Date),
        'Egyptian',
        'Hanafi'
      );
      expect(result.prayers).toHaveLength(6);
      expect(result.theme).toEqual(expect.objectContaining({ bg: expect.any(String) }));
    });

    it('falls back to default method/madhab when not stored', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      PrayerUtils.calculatePrayerTimes.mockReturnValue(FULL_DAY);

      await getWidgetPrayerData();

      expect(PrayerUtils.calculatePrayerTimes).toHaveBeenCalledWith(
        LOCATION.latitude,
        LOCATION.longitude,
        LOCATION.timezone,
        expect.any(Date),
        PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD,
        PRAYER_CONSTANTS.DEFAULT_MADHAB
      );
    });
  });

  describe('syncWidgetData()', () => {
    it('does nothing when there is no widget data', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await syncWidgetData();
      expect(SharedGroupPreferences.setItem).not.toHaveBeenCalled();
      expect(requestWidgetUpdate).not.toHaveBeenCalled();
    });

    it('writes to SharedGroupPreferences on iOS', async () => {
      Platform.OS = 'ios';
      AsyncStorage.getItem
        .mockResolvedValueOnce('en')
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('MuslimWorldLeague')
        .mockResolvedValueOnce('Shafi')
        .mockResolvedValueOnce('originalGreen');
      PrayerUtils.calculatePrayerTimes.mockReturnValue(FULL_DAY);

      await syncWidgetData();

      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith(
        WIDGET_DATA_KEY,
        expect.objectContaining({ city: 'New York' }),
        WIDGET_APP_GROUP
      );
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith(
        WIDGET_THEME_KEY,
        expect.objectContaining({ bg: expect.any(String) }),
        WIDGET_APP_GROUP
      );
      expect(SharedGroupPreferences.setItem).toHaveBeenCalledWith(
        WIDGET_LANGUAGE_KEY,
        'en',
        WIDGET_APP_GROUP
      );
      expect(requestWidgetUpdate).not.toHaveBeenCalled();
    });

    it('requests a widget update on Android', async () => {
      Platform.OS = 'android';
      AsyncStorage.getItem
        .mockResolvedValueOnce('ar')
        .mockResolvedValueOnce(JSON.stringify(LOCATION))
        .mockResolvedValueOnce('MuslimWorldLeague')
        .mockResolvedValueOnce('Shafi')
        .mockResolvedValueOnce('originalGreen');
      PrayerUtils.calculatePrayerTimes.mockReturnValue(FULL_DAY);

      await syncWidgetData();

      expect(requestWidgetUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ widgetName: 'PrayerTimes', renderWidget: expect.any(Function) })
      );
      expect(SharedGroupPreferences.setItem).not.toHaveBeenCalled();

      Platform.OS = 'ios';
    });

    it('swallows errors without throwing', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('storage fail'));

      await expect(syncWidgetData()).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
