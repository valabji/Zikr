import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import {
  calculatePrayerTimes,
  getCurrentAndNextPrayer,
  getTimeUntilNextPrayer,
  formatPrayerTime,
} from './PrayerUtils';
import NotificationService from './NotificationService';
import moment from 'moment-timezone';

/**
 * PrayerCountdownService - Manages persistent countdown notification
 * 
 * This service keeps the countdown notification active even when the app is closed
 * by scheduling periodic updates and managing the notification state.
 */
class PrayerCountdownService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Initialize the countdown service
   * Checks if it should be enabled and starts if needed
   */
  async initialize() {
    try {
      const enabled = await AsyncStorage.getItem('@persistent_countdown');
      if (enabled === 'true') {
        await this.start();
      }
    } catch (error) {
      console.error('Error initializing countdown service:', error);
    }
  }

  /**
   * Start the countdown service
   */
  async start() {
    if (this.isRunning) {
      console.log('📊 Countdown service already running');
      return;
    }

    try {
      // Load required data
      const location = await this.getLocation();
      const calculationMethod = await this.getCalculationMethod();
      const madhab = await this.getMadhab();

      if (!location) {
        console.log('📊 No location set, countdown service not started');
        return;
      }

      this.isRunning = true;
      console.log('📊 Starting countdown service');

      // Initial update
      await this.updateCountdown(location, calculationMethod, madhab);

      // Set up periodic updates (every 60 seconds)
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateCountdown(location, calculationMethod, madhab);
        } catch (error) {
          console.error('Error in countdown update interval:', error);
        }
      }, 60000); // 60 seconds

    } catch (error) {
      console.error('Error starting countdown service:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the countdown service
   */
  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    await NotificationService.hidePersistentCountdown();
    console.log('📊 Countdown service stopped');
  }

  /**
   * Update the countdown notification
   */
  async updateCountdown(location, calculationMethod, madhab) {
    try {
      // Calculate prayer times
      const times = calculatePrayerTimes(
        location.latitude,
        location.longitude,
        location.timezone,
        new Date(),
        calculationMethod,
        madhab
      );

      if (!times) {
        console.error('Failed to calculate prayer times');
        return;
      }

      // Get current and next prayer
      const { next } = getCurrentAndNextPrayer(
        times,
        location.latitude,
        location.longitude,
        location.timezone,
        calculationMethod,
        madhab
      );

      if (!next || !next.time) {
        console.error('No next prayer found');
        return;
      }

      // Get time until next prayer
      const timeRemaining = getTimeUntilNextPrayer(next.time);
      if (!timeRemaining) {
        console.log('No time remaining, recalculating...');
        // Recalculate for next day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = calculatePrayerTimes(
          location.latitude,
          location.longitude,
          location.timezone,
          tomorrow,
          calculationMethod,
          madhab
        );
        if (tomorrowTimes) {
          const { next: tomorrowNext } = getCurrentAndNextPrayer(
            tomorrowTimes,
            location.latitude,
            location.longitude,
            location.timezone,
            calculationMethod,
            madhab
          );
          if (tomorrowNext && tomorrowNext.time) {
            const tomorrowRemaining = getTimeUntilNextPrayer(tomorrowNext.time);
            if (tomorrowRemaining) {
              const formattedTime = formatPrayerTime(tomorrowNext.time);
              await NotificationService.showPersistentCountdown(
                this.getPrayerName(tomorrowNext.name),
                formattedTime,
                tomorrowRemaining,
                'Next Prayer'
              );
            }
          }
        }
        return;
      }

      // Update notification
      const formattedTime = formatPrayerTime(next.time);
      await NotificationService.showPersistentCountdown(
        this.getPrayerName(next.name),
        formattedTime,
        timeRemaining,
        'Next Prayer'
      );

    } catch (error) {
      console.error('Error updating countdown:', error);
    }
  }

  /**
   * Get prayer name (without translation as we're in background)
   */
  getPrayerName(prayerKey) {
    const names = {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    };
    return names[prayerKey] || prayerKey;
  }

  /**
   * Get location from storage
   */
  async getLocation() {
    try {
      const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      return savedLocation ? JSON.parse(savedLocation) : null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Get calculation method from storage
   */
  async getCalculationMethod() {
    try {
      const method = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD);
      return method || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD;
    } catch (error) {
      console.error('Error getting calculation method:', error);
      return PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD;
    }
  }

  /**
   * Get madhab from storage
   */
  async getMadhab() {
    try {
      const madhab = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB);
      return madhab || PRAYER_CONSTANTS.DEFAULT_MADHAB;
    } catch (error) {
      console.error('Error getting madhab:', error);
      return PRAYER_CONSTANTS.DEFAULT_MADHAB;
    }
  }

  /**
   * Check if service is running
   */
  isServiceRunning() {
    return this.isRunning;
  }
}

// Export singleton instance
export default new PrayerCountdownService();
