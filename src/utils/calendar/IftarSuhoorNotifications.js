import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import notificationService from '@/utils/notifications/NotificationService';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { dateKey } from '@/utils/calendar/HijriCalendar';
import { t } from '@/locales/i18n';
import { normalizePrayerLocation } from '@/utils/prayer/prayerTimeZone';
import { loadFastingDays } from '@/utils/calendar/FastingTracker';

let operations = Promise.resolve();
function enqueue(operation) {
  const next = operations.then(operation);
  operations = next.catch(() => {});
  return next;
}

async function getSavedLocation() {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    return raw ? normalizePrayerLocation(JSON.parse(raw)) : null;
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

export function scheduleFastDayNotifications(date) {
  return enqueue(() => scheduleDay(date));
}

async function scheduleDay(date) {
  const location = await getSavedLocation();
  if (!location) return false;

  const { calculationMethod, madhab } = await getSavedPrayerSettings();
  const timezone = location.timezone || 'UTC';
  const times = calculatePrayerTimes(location.latitude, location.longitude, timezone, date, calculationMethod, madhab);
  if (!times?.fajr?.isValid() || !times?.maghrib?.isValid()) return false;

  const key = dateKey(date);
  const suhoorTime = times.fajr.clone().subtract(ISLAMIC_CALENDAR_CONSTANTS.SUHOOR_OFFSET_MINUTES, 'minutes');
  let scheduled = true;

  if (suhoorTime.toDate().getTime() > Date.now()) {
    const id = await notificationService.scheduleExactNotification(
      `suhoor-${key}`,
      t('islamicCalendar.notifications.suhoorTitle'),
      t('islamicCalendar.notifications.suhoorBody'),
      suhoorTime.toDate(),
      'short'
    );
    if (!id) scheduled = false;
  } else {
    await notificationService.cancelNotification(`suhoor-${key}`);
  }

  if (times.maghrib.toDate().getTime() > Date.now()) {
    const id = await notificationService.scheduleExactNotification(
      `iftar-${key}`,
      t('islamicCalendar.notifications.iftarTitle'),
      t('islamicCalendar.notifications.iftarBody'),
      times.maghrib.toDate(),
      'short'
    );
    if (!id) scheduled = false;
  } else {
    await notificationService.cancelNotification(`iftar-${key}`);
  }

  return scheduled;
}

export function cancelFastDayNotifications(date) {
  return enqueue(() => cancelDay(date));
}

async function cancelDay(date) {
  const key = dateKey(date);
  await notificationService.cancelNotification(`suhoor-${key}`);
  await notificationService.cancelNotification(`iftar-${key}`);
}

// Retiming existing reminders preserves the user's calendar selections and other notification types.
export function refreshFastDayNotifications() {
  return enqueue(refreshPending);
}

async function refreshPending() {
  if (Platform.OS === 'web') return true;
  try {
    const pending = (await notificationService.getScheduledNotifications())
      .filter(({ identifier }) => /^(suhoor|iftar)-\d{4}-\d{2}-\d{2}$/.test(identifier));
    if (!pending.length) return true;
    const enabled = await AsyncStorage.getItem(ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    if (enabled !== 'true') {
      for (const { identifier } of pending) await notificationService.cancelNotification(identifier);
      return true;
    }
    const selectedDays = await loadFastingDays();
    const days = new Set(pending.map(({ identifier }) => identifier.slice(-10)));
    let updated = true;
    for (const day of [...days].sort()) {
      const date = new Date(`${day}T12:00:00`);
      if (!selectedDays[day]) await cancelDay(date);
      else if (!await scheduleDay(date)) updated = false;
    }
    return updated;
  } catch (error) {
    console.error('Error refreshing fasting reminders:', error);
    return false;
  }
}
