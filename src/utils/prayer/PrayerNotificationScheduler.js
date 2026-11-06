import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import { Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';
import NotificationService from '@/utils/notifications/NotificationService';
import { t, initializeLanguage } from '@/locales/i18n';
import { normalizePrayerLocation, prayerDate } from '@/utils/prayer/prayerTimeZone';
import { refreshFastDayNotifications } from '@/utils/calendar/IftarSuhoorNotifications';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const SCHEDULED_IDS_KEY = '@scheduled_prayer_ids';
export const PRAYER_REFRESH_TASK = 'zikr-prayer-schedule-refresh';
const RENEWAL_ID = 'prayer-schedule-renewal';
const isPrayerId = id => id === RENEWAL_ID || /^prayer-(fajr|dhuhr|asr|maghrib|isha)-/.test(id);

/**
 * PrayerNotificationScheduler - reads user settings and schedules
 * Keeps a rolling offline schedule, renewed at boot, on foreground and by
 * the OS background task. A renewal reminder covers suspended background work.
 */
class PrayerNotificationScheduler {
  constructor() {
    this.scheduledIds = [];
    this.operations = Promise.resolve();
  }

  initialize() {
    return this._enqueue(() => this._initialize());
  }

  async _initialize() {
    if (Platform.OS === 'web') return true;
    try {
      const enabled = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      try {
        if (enabled === 'true') {
          await BackgroundTask.registerTaskAsync(PRAYER_REFRESH_TASK, { minimumInterval: 12 * 60 });
        } else {
          await BackgroundTask.unregisterTaskAsync(PRAYER_REFRESH_TASK);
        }
      } catch (error) {
        console.warn('Prayer background refresh unavailable:', error);
      }
      const fastingUpdated = await refreshFastDayNotifications();
      const prayersUpdated = enabled === 'true' ? await this._scheduleAll() : await this._cancelAll();
      return fastingUpdated && prayersUpdated;
    } catch (error) {
      console.error('Error initializing prayer notification scheduler:', error);
      return false;
    }
  }

  async refresh() {
    return this.initialize();
  }

  _enqueue(operation) {
    const next = this.operations.then(operation);
    this.operations = next.catch(() => {});
    return next;
  }

  scheduleAll() {
    return this._enqueue(() => this._scheduleAll());
  }

  async _scheduleAll() {
    try {
      const enabled = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      if (enabled !== 'true') {
        return await this._cancelAll();
      }

      const location = await this._getLocation();
      if (!location) {
        console.log('📍 No prayer location set, skipping scheduling');
        return false;
      }

      const calculationMethod = await this._getCalculationMethod();
      const madhab = await this._getMadhab();
      const enabledPrayers = await this._getEnabledPrayers();
      const audioMode = await this._getAudioMode();

      const now = Date.now();
      const scheduled = await NotificationService.getScheduledNotifications();
      const previousIds = new Set([...this.scheduledIds, ...scheduled.map(n => n.identifier).filter(isPrayerId)]);
      // iOS keeps 64 pending notifications; reserve one for renewal and retain other features' reminders.
      const available = Platform.OS === 'ios'
        ? Math.max(0, 63 - scheduled.filter(n => !isPrayerId(n.identifier)).length) : 150;
      const days = Platform.OS === 'ios' ? 10 : 30;
      const planned = [];
      const newIds = [];

      for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const date = prayerDate(location.timezone, dayOffset);
        const times = calculatePrayerTimes(
          location.latitude,
          location.longitude,
          location.timezone,
          date,
          calculationMethod,
          madhab,
        );
        if (!times) continue;

        const dateKey = moment(date).format('YYYYMMDD');

        for (const prayer of PRAYER_NAMES) {
          if (!enabledPrayers[prayer]) continue;
          const time = times[prayer];
          if (!time) continue;

          const triggerDate = time.toDate();
          if (triggerDate.getTime() <= now) continue;

          const id = `prayer-${prayer}-${dateKey}`;
          const title = this._getTitle(prayer);
          const body = this._getBody(prayer, time);

          planned.push({ id, title, body, triggerDate });
        }
      }

      if (!PRAYER_NAMES.some(prayer => enabledPrayers[prayer])) {
        return await this._cancelAll();
      }
      const upcoming = planned.sort((a, b) => a.triggerDate - b.triggerDate).slice(0, available);
      if (!upcoming.length) return false;
      const keep = new Set([...upcoming.map(n => n.id), RENEWAL_ID]);
      for (const id of previousIds) {
        if (!keep.has(id)) await NotificationService.cancelNotification(id);
      }
      let lastScheduled;
      for (const { id, title, body, triggerDate } of upcoming) {
        if (await NotificationService.scheduleExactNotification(id, title, body, triggerDate, audioMode)) {
          newIds.push(id);
          lastScheduled = triggerDate;
        }
      }
      if (lastScheduled) {
        const renewalDate = new Date(Math.max(now + 1000, lastScheduled.getTime() - 86400000));
        const renewal = await NotificationService.scheduleExactNotification(
          RENEWAL_ID,
          t('settings.notifications.renewalTitle'),
          t('settings.notifications.renewalBody', { date: moment(lastScheduled).tz(location.timezone).format('LL') }),
          renewalDate,
          'none',
        );
        if (renewal) newIds.push(RENEWAL_ID);
      }
      this.scheduledIds = newIds;
      await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(newIds));
      console.log(`🕌 Scheduled ${newIds.length} prayer notifications`);
      return newIds.length === upcoming.length + 1;
    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
      return false;
    }
  }

  cancelAll() {
    return this._enqueue(() => this._cancelAll());
  }

  async _cancelAll() {
    try {
      let ids = this.scheduledIds;
      if (!ids.length) {
        const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            ids = Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
          } catch {
            ids = [];
          }
        }
      }
      for (const id of ids) {
        await NotificationService.cancelNotification(id);
      }
      const scheduled = await NotificationService.getScheduledNotifications();
      for (const { identifier } of scheduled) {
        if (isPrayerId(identifier) && !ids.includes(identifier)) await NotificationService.cancelNotification(identifier);
      }
      this.scheduledIds = [];
      await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
      return true;
    } catch (error) {
      console.error('Error cancelling prayer notifications:', error);
      return false;
    }
  }

  _getTitle(prayer) {
    const name = t(`prayerTimes.${prayer}`);
    return `🕌 ${name || prayer}`;
  }

  _getBody(prayer, time) {
    const name = t(`prayerTimes.${prayer}`) || prayer;
    return `${name} • ${time.format('h:mm A')}`;
  }

  async _getLocation() {
    try {
      const stored = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      return stored ? normalizePrayerLocation(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  }

  async _getCalculationMethod() {
    return (await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD)) ||
      PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD;
  }

  async _getMadhab() {
    return (await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB)) ||
      PRAYER_CONSTANTS.DEFAULT_MADHAB;
  }

  async _getEnabledPrayers() {
    const stored = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS);
    try {
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return Object.fromEntries(PRAYER_NAMES.map(name => [name, parsed[name] !== false]));
        }
      }
    } catch {}
    return { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
  }

  async _getAudioMode() {
    return (await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.AUDIO_MODE)) || 'short';
  }
}

const scheduler = new PrayerNotificationScheduler();

if (Platform.OS !== 'web') {
  TaskManager.defineTask(PRAYER_REFRESH_TASK, async ({ error } = {}) => {
    if (error) return BackgroundTask.BackgroundTaskResult.Failed;
    try {
      await initializeLanguage();
      await NotificationService.initializeChannels();
      return await scheduler.refresh()
        ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
    } catch (error) {
      console.error('Background prayer refresh failed:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export default scheduler;
