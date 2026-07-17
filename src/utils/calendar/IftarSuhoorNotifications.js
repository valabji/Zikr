import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { dateKey } from '@/utils/calendar/HijriCalendar';
import { t } from '@/locales/i18n';

async function getSavedLocation() {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function getSavedPrayerSettings() {
  const [method, madhab] = await Promise.all([
    AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD),
    AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB),
  ]);
  return {
    calculationMethod: method || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD,
    madhab: madhab || PRAYER_CONSTANTS.DEFAULT_MADHAB,
  };
}

export async function scheduleFastDayNotifications(date) {
  const location = await getSavedLocation();
  if (!location) return false;

  const { calculationMethod, madhab } = await getSavedPrayerSettings();
  const timezone = location.timezone || 'UTC';
  const times = calculatePrayerTimes(location.latitude, location.longitude, timezone, date, calculationMethod, madhab);
  if (!times) return false;

  const key = dateKey(date);
  const suhoorTime = times.fajr.clone().subtract(ISLAMIC_CALENDAR_CONSTANTS.SUHOOR_OFFSET_MINUTES, 'minutes');

  if (suhoorTime.toDate().getTime() > Date.now()) {
    await notificationService.scheduleExactNotification(
      `suhoor-${key}`,
      t('islamicCalendar.notifications.suhoorTitle'),
      t('islamicCalendar.notifications.suhoorBody'),
      suhoorTime.toDate(),
      'short'
    );
  }

  if (times.maghrib.toDate().getTime() > Date.now()) {
    await notificationService.scheduleExactNotification(
      `iftar-${key}`,
      t('islamicCalendar.notifications.iftarTitle'),
      t('islamicCalendar.notifications.iftarBody'),
      times.maghrib.toDate(),
      'short'
    );
  }

  return true;
}

export async function cancelFastDayNotifications(date) {
  const key = dateKey(date);
  await notificationService.cancelNotification(`suhoor-${key}`);
  await notificationService.cancelNotification(`iftar-${key}`);
}
