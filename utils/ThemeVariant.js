import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePrayerTimes } from './PrayerUtils';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

export const THEME_VARIANT_KEYS = ['fajr', 'duha', 'asr', 'isha'];

export const resolvePrayerPeriod = (times, now) => {
  if (!times) return null;
  if (now.isBefore(times.fajr)) return 'isha';
  if (now.isBefore(times.sunrise)) return 'fajr';
  if (now.isBefore(times.asr)) return 'duha';
  if (now.isBefore(times.maghrib)) return 'asr';
  return 'isha';
};

export const getCurrentPrayerVariant = async (now = moment()) => {
  try {
    const [rawLocation, method, madhab] = await Promise.all([
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB),
    ]);
    if (!rawLocation) return null;
    const location = JSON.parse(rawLocation);
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return null;
    }
    const timezone = location.timezone || 'UTC';
    const times = calculatePrayerTimes(
      location.latitude,
      location.longitude,
      timezone,
      now.toDate(),
      method || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD,
      madhab || PRAYER_CONSTANTS.DEFAULT_MADHAB
    );
    return resolvePrayerPeriod(times, now);
  } catch {
    return null;
  }
};
