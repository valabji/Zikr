import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { calculatePrayerTimes } from './PrayerUtils';
import NotificationService from './NotificationService';
import { t } from '../locales/i18n';

const SCHEDULE_HORIZON_DAYS = 3;
const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const SCHEDULED_IDS_KEY = '@scheduled_prayer_ids';

/**
 * PrayerNotificationScheduler - reads user settings and schedules
 * exact-time notifications for each upcoming prayer within a rolling
 * horizon (today + next 2 days). Refresh on app boot and on foreground
 * so the horizon stays ahead.
 */
class PrayerNotificationScheduler {
  constructor() {
    this.scheduledIds = [];
  }

  async initialize() {
    try {
      const enabled = await AsyncStorage.getItem('@notifications_enabled');
      if (enabled === 'true') {
        await this.scheduleAll();
      } else {
        await this.cancelAll();
      }
    } catch (error) {
      console.error('Error initializing prayer notification scheduler:', error);
    }
  }

  async refresh() {
    await this.initialize();
  }

  async scheduleAll() {
    try {
      await this.cancelAll();

      const enabled = await AsyncStorage.getItem('@notifications_enabled');
      if (enabled !== 'true') {
        console.log('🔕 Prayer notifications disabled');
        return;
      }

      const location = await this._getLocation();
      if (!location) {
        console.log('📍 No prayer location set, skipping scheduling');
        return;
      }

      const calculationMethod = await this._getCalculationMethod();
      const madhab = await this._getMadhab();
      const enabledPrayers = await this._getEnabledPrayers();
      const audioMode = await this._getAudioMode();

      const now = Date.now();
      const newIds = [];

      for (let dayOffset = 0; dayOffset < SCHEDULE_HORIZON_DAYS; dayOffset++) {
        const date = moment().add(dayOffset, 'days').toDate();
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

          const scheduledId = await NotificationService.scheduleExactNotification(
            id,
            title,
            body,
            triggerDate,
            audioMode,
          );

          if (scheduledId) {
            newIds.push(id);
          }
        }
      }

      this.scheduledIds = newIds;
      await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(newIds));
      console.log(`🕌 Scheduled ${newIds.length} prayer notifications`);
    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
    }
  }

  async cancelAll() {
    try {
      let ids = this.scheduledIds;
      if (!ids.length) {
        const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
        if (stored) {
          try {
            ids = JSON.parse(stored);
          } catch {
            ids = [];
          }
        }
      }
      for (const id of ids) {
        await NotificationService.cancelNotification(id);
      }
      this.scheduledIds = [];
      await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
    } catch (error) {
      console.error('Error cancelling prayer notifications:', error);
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
      return stored ? JSON.parse(stored) : null;
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
    try {
      const stored = await AsyncStorage.getItem('@enabled_prayers');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
  }

  async _getAudioMode() {
    return (await AsyncStorage.getItem('@audio_mode')) || 'short';
  }
}

export default new PrayerNotificationScheduler();
