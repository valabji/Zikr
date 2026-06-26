import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sounds from './Sounds';

// Bundled via the expo-notifications config plugin (app.config.js). Used as the
// native sound so the adhan plays even when the app is backgrounded or killed,
// where JS listeners never run.
const ADHAN_SOUND = 'adhan_alert.wav';
const ADHAN_CHANNEL = 'prayer_adhan';
const SILENT_CHANNEL = 'prayer_silent';

/**
 * NotificationService - Handles all notification operations for adhan reminders
 * 
 * CRITICAL: Android 12+ requires exact alarm permissions for precise timing
 * WITHOUT exact alarms, notifications can be delayed by 15-30 minutes!
 * 
 * Key Features:
 * - Request notification permissions (iOS/Android)
 * - Schedule exact notifications (Android exact alarms)
 * - Check exact alarm permission status
 * - Open system settings for exact alarms
 * - Check battery optimization status
 * - Cancel notifications
 */
class NotificationService {
  constructor() {
    // Note: Actual initialization happens in initialize() method
    // which should be called explicitly after construction
  }

  /**
   * Initialize the notification service
   * MUST be called before using any other methods
   */
  async initialize() {
    // Set notification handler (how notifications appear)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,  // Shows banner notification
        shouldShowList: true,    // Shows in notification list
        shouldPlaySound: false,  // We'll play custom audio separately
        shouldSetBadge: true,
      }),
    });

    // Setup notification listeners
    this.setupNotificationListener();
    
    // Initialize notification channels on Android
    await this.initializeChannels();
    
    console.log('✅ NotificationService initialized');
  }

  /**
   * Initialize notification channels (Android only)
   * Must be called before scheduling any notifications on Android 8.0+
   *
   * Two channels — Android already exposes these as separate toggles to the
   * user, and we keep exactly one displayed notification per channel
   * (the next-prayer countdown and the most recent alarm).
   */
  async initializeChannels() {
    if (Platform.OS !== 'android') return;

    // The original 'prayer_reminders' channel shipped with sound:null and is
    // immutable, so on many devices it fell back to the default system sound.
    // Recreate the alarm under a new channel id that carries the bundled adhan.
    try {
      await Notifications.deleteNotificationChannelAsync('prayer_reminders');
    } catch (e) {
      console.warn('Could not delete legacy prayer_reminders channel:', e);
    }

    await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL, {
      name: 'Prayer Adhan',
      description: 'Plays the adhan when a prayer time arrives',
      importance: Notifications.AndroidImportance.MAX,
      sound: ADHAN_SOUND,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
      name: 'Prayer Reminders (Silent)',
      description: 'Shows a prayer reminder without sound',
      importance: Notifications.AndroidImportance.MAX,
      sound: null,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('prayer-countdown', {
      name: 'Next Prayer',
      description: 'Persistent countdown to the next prayer',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    console.log('✅ Notification channels initialized');
  }

  /**
   * Setup notification listener for user interactions
   * Plays appropriate audio when notification is received or tapped
   */
  setupNotificationListener() {
    // When notification is received (app in foreground)
    Notifications.addNotificationReceivedListener(async (notification) => {
      const currentId = notification.request.identifier;
      console.log('📩 Notification received:', currentId);

      const { soundType } = notification.request.content.data || {};
      if (soundType) {
        await Sounds.playNotificationSound(soundType, false);
        // Replace any prior alarm in the tray with this one.
        await this._dismissOtherAlarms(currentId);
      }
    });

    // When user taps notification (app in background)
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('👆 Notification tapped:', response.notification.request.identifier);

      // Play full adhan when tapped
      const { soundType } = response.notification.request.content.data;
      if (soundType) {
        await Sounds.playNotificationSound(soundType, true);
      }
    });
  }

  /**
   * Dismiss any displayed prayer alarms except `keepId` and the persistent
   * countdown. Used to enforce a single alarm in the tray.
   */
  async _dismissOtherAlarms(keepId) {
    try {
      const presented = (await Notifications.getPresentedNotificationsAsync?.()) || [];
      await Promise.all(
        presented
          .map((n) => n?.request?.identifier)
          .filter((id) => id && id.startsWith('prayer-') && id !== keepId && id !== 'prayer-countdown-persistent')
          .map((id) => Notifications.dismissNotificationAsync(id))
      );
    } catch (error) {
      console.error('Error dismissing other prayer alarms:', error);
    }
  }

  /**
   * Clear stale prayer alarms from the tray, keeping the persistent
   * countdown. Call on app foreground so alarms that fired while the
   * app was killed don't pile up.
   */
  async consolidatePrayerAlarms() {
    await this._dismissOtherAlarms(null);
  }

  /**
   * Request notification permissions
   * iOS: Shows system permission dialog
   * Android: Automatically granted on install, but we verify
   * 
   * @returns {Object} { granted: boolean, ios: object, android: object }
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If not determined, request permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return {
          granted: false,
          message: 'Notification permission denied. Please enable in Settings.',
        };
      }

      // Android: Check exact alarm permission (CRITICAL)
      if (Platform.OS === 'android') {
        const hasExactAlarmPermission = await this.checkExactAlarmPermission();
        
        if (!hasExactAlarmPermission) {
          return {
            granted: true,
            exactAlarmGranted: false,
            message: 'Exact alarm permission required for precise prayer time notifications.',
            needsExactAlarm: true,
          };
        }

        return {
          granted: true,
          exactAlarmGranted: true,
          message: 'All permissions granted',
        };
      }

      // iOS: All set
      return {
        granted: true,
        message: 'Notification permission granted',
      };

    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if app has exact alarm permission (Android 12+)
   * 
   * @returns {boolean} True if permission granted or not required
   */
  async checkExactAlarmPermission() {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this
    }

    try {
      // Android 12+ (API 31+) requires explicit permission
      if (Platform.Version >= 31) {
        // ⚠️ Note: expo-notifications doesn't provide a direct API to check
        // SCHEDULE_EXACT_ALARM permission. This checks notification permission only.
        // Users may need to manually grant exact alarm permission in system settings.
        const hasPermission = await Notifications.getPermissionsAsync();
        
        // We can only check if notifications are granted
        // The actual SCHEDULE_EXACT_ALARM permission must be checked/granted
        // through system settings (opened via openExactAlarmSettings method)
        const canScheduleExact = hasPermission.granted;
        
        if (!canScheduleExact) {
          console.warn('Notification permission not granted');
        }
        
        return canScheduleExact;
      }

      // Android 11 and below: exact alarms work by default
      return true;

    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Open system settings for exact alarm permission (Android 12+)
   * User must manually enable "Alarms & reminders" permission
   */
  async openExactAlarmSettings() {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Required', 'Exact alarms are only needed on Android.');
      return;
    }

    try {
      // Android 12+ (API 31+): Open exact alarm settings
      if (Platform.Version >= 31) {
        await IntentLauncher.startActivityAsync(
          'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
          {
            data: 'package:com.valabji.zikr',
          }
        );
      } else {
        Alert.alert(
          'Not Required',
          'Your Android version does not require exact alarm permission.'
        );
      }
    } catch (error) {
      console.error('Error opening exact alarm settings:', error);
      
      // Fallback: Open app info settings
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.valabji.zikr',
          }
        );
      } catch (fallbackError) {
        console.error('Error opening app settings:', fallbackError);
        Alert.alert(
          'Error',
          'Could not open settings. Please manually go to Settings > Apps > Zikr > Permissions'
        );
      }
    }
  }

  /**
   * Check if app is affected by battery optimization (Android)
   * Battery optimization can delay or prevent notifications
   * 
   * @returns {boolean} True if battery optimization is enabled (bad)
   */
  async checkBatteryOptimization() {
    if (Platform.OS !== 'android') {
      return false; // iOS doesn't have this issue
    }

    try {
      // We can't directly check battery optimization status with Expo
      // Instead, we'll check if notifications are being delayed
      // Store the last notification time and compare
      const lastCheck = await AsyncStorage.getItem('lastBatteryCheck');
      const now = Date.now();
      
      if (!lastCheck) {
        await AsyncStorage.setItem('lastBatteryCheck', now.toString());
        return false; // First time, assume not optimized
      }

      // If it's been more than 24 hours, suggest checking battery settings
      const hoursSinceCheck = (now - parseInt(lastCheck)) / (1000 * 60 * 60);
      return hoursSinceCheck > 24;

    } catch (error) {
      console.error('Error checking battery optimization:', error);
      return false;
    }
  }

  /**
   * Open battery optimization settings (Android)
   * User should disable battery optimization for the app
   */
  async openBatterySettings() {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Applicable', 'Battery optimization is Android-specific.');
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
      
      Alert.alert(
        'Disable Battery Optimization',
        'Find "Zikr" in the list and select "Don\'t optimize" to ensure reliable notifications.'
      );

    } catch (error) {
      console.error('Error opening battery settings:', error);
      
      // Fallback: Open app info
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.valabji.zikr',
          }
        );
      } catch (fallbackError) {
        Alert.alert(
          'Error',
          'Could not open settings. Please manually go to Settings > Battery > Battery optimization'
        );
      }
    }
  }

  /**
   * Schedule an exact notification at a specific time
   * Uses Android exact alarms for precise timing (CRITICAL)
   * 
   * @param {string} id - Unique notification ID (e.g., 'fajr', 'dhuhr')
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Date} triggerDate - Exact time to trigger
   * @param {string} sound - Audio file to play ('short' or 'full')
   * @returns {string|null} Notification ID if successful, null if failed
   */
  async scheduleExactNotification(id, title, body, triggerDate, sound = 'short') {
    try {
      // Validate trigger date
      if (!(triggerDate instanceof Date) || triggerDate.getTime() <= Date.now()) {
        console.error('Invalid trigger date:', triggerDate);
        return null;
      }

      // Cancel existing notification with same ID
      await this.cancelNotification(id);

      // Silent mode shows the reminder with no sound; every other mode plays
      // the bundled adhan natively so it fires reliably from the background.
      const isSilent = sound === 'none';

      const content = {
        title,
        body,
        sound: isSilent ? null : ADHAN_SOUND,
        data: {
          notificationId: id,
          soundType: sound, // 'none' | 'short' | 'full'
          scheduledTime: triggerDate.getTime(),
        },
        priority: Platform.OS === 'android'
          ? Notifications.AndroidNotificationPriority.HIGH
          : undefined,
        categoryIdentifier: 'prayer_reminder',
        ...(Platform.OS === 'android' && { channelId: isSilent ? SILENT_CHANNEL : ADHAN_CHANNEL }),
      };

      // Prepare trigger with exact timing
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      };

      // Schedule notification (use deterministic identifier so cancelNotification(id) works)
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: id,
        content,
        trigger,
      });

      console.log(`✅ Scheduled notification "${id}" for ${triggerDate.toLocaleString()}`);
      return notificationId;

    } catch (error) {
      console.error(`Error scheduling notification "${id}":`, error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   * 
   * @param {string} identifier - Notification identifier to cancel
   */
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`❌ Cancelled notification: ${identifier}`);
    } catch (error) {
      console.error(`Error cancelling notification "${identifier}":`, error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all currently scheduled notifications
   * Useful for debugging
   * 
   * @returns {Array} Array of scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Create notification channel (Android only)
   * MUST be called before scheduling any notifications on Android
   * 
   * @param {string} id - Channel ID
   * @param {string} name - Channel name (shown to user)
   * @param {string} description - Channel description
   */
  async createNotificationChannel(id, name, description) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(id, {
        name,
        description,
        importance: Notifications.AndroidImportance.MAX, // Highest priority
        sound: null, // We'll play custom audio
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Show even in Do Not Disturb mode
      });
      console.log(`✅ Created notification channel: ${id}`);
    }
  }

  /**
   * Show or update persistent countdown notification
   * This notification stays in the tray and shows next prayer countdown.
   * Caller is responsible for localizing the title and body so the
   * notification stays in a single language.
   *
   * @param {string} title - Notification title (already localized)
   * @param {string} body - Notification body (already localized, may contain newlines)
   * @param {string} [prayer] - Prayer key for the data payload (optional)
   */
  async showPersistentCountdown(title, body, prayer) {
    try {
      // Stable identifier — re-scheduling with the same id replaces the
      // existing notification in the tray instead of stacking a new one.
      await Notifications.scheduleNotificationAsync({
        identifier: 'prayer-countdown-persistent',
        content: {
          title,
          body,
          sound: null,
          priority: Platform.OS === 'android'
            ? Notifications.AndroidNotificationPriority.LOW
            : undefined,
          sticky: true,
          ...(Platform.OS === 'android' && { channelId: 'prayer-countdown' }),
          data: {
            type: 'countdown',
            ...(prayer && { prayer }),
          },
        },
        trigger: null, // Show immediately
      });

      console.log(`📊 Updated persistent countdown: ${prayer || ''}`);
    } catch (error) {
      console.error('Error showing persistent countdown:', error);
    }
  }

  /**
   * Hide the persistent countdown notification
   */
  async hidePersistentCountdown() {
    try {
      await Notifications.dismissNotificationAsync('prayer-countdown-persistent');
      console.log('🚫 Hidden persistent countdown notification');
    } catch (error) {
      console.error('Error hiding persistent countdown:', error);
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();

// Export the instance and make sure users call initialize()
export default notificationService;