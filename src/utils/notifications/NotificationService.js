import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Sounds from '@/utils/audio/Sounds';
import { permissionMethods } from '@/utils/notifications/notificationPermissions';
import { DOWNLOAD_CHANNEL } from '@/utils/quran/quranDownloadNotifications';

// Bundled via the expo-notifications config plugin so the adhan plays natively when the app is backgrounded or killed
const ADHAN_SOUND = 'adhan_alert.wav';
const ADHAN_CHANNEL = 'prayer_adhan';
const SILENT_CHANNEL = 'prayer_silent';

class NotificationService {
  async initialize() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Suppress the banner so the live download notification updates in place instead of re-popping.
        if (notification?.request?.content?.data?.type === 'quran-download') {
          return {
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        };
      },
    });

    this.setupNotificationListener();
    await this.initializeChannels();

    console.log('✅ NotificationService initialized');
  }

  async initializeChannels() {
    if (Platform.OS !== 'android') return;

    // The legacy prayer_reminders channel shipped with sound:null and is immutable; recreate under a new id carrying the bundled adhan
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

    await Notifications.setNotificationChannelAsync(DOWNLOAD_CHANNEL, {
      name: 'Qur\'an Downloads',
      description: 'Shows progress while Qur\'an audio is downloading',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    console.log('✅ Notification channels initialized');
  }

  // Audio is played by these listeners, not the notification itself, so iOS doesn't double-play
  setupNotificationListener() {
    Notifications.addNotificationReceivedListener(async (notification) => {
      const currentId = notification.request.identifier;
      console.log('📩 Notification received:', currentId);

      const { soundType } = notification.request.content.data || {};
      if (soundType) {
        await Sounds.playNotificationSound(soundType, false);
        await this._dismissOtherAlarms(currentId);
      }
    });

    Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('👆 Notification tapped:', response.notification.request.identifier);

      const { soundType } = response.notification.request.content.data;
      if (soundType) {
        await Sounds.playNotificationSound(soundType, true);
      }
    });
  }

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

  // Call on app foreground so alarms that fired while the app was killed don't pile up
  async consolidatePrayerAlarms() {
    await this._dismissOtherAlarms(null);
  }

  async scheduleExactNotification(id, title, body, triggerDate, sound = 'short') {
    try {
      if (!(triggerDate instanceof Date) || triggerDate.getTime() <= Date.now()) {
        console.error('Invalid trigger date:', triggerDate);
        return null;
      }

      await this.cancelNotification(id);

      // Silent mode shows the reminder with no sound; every other mode plays the bundled adhan natively
      const isSilent = sound === 'none';

      const content = {
        title,
        body,
        sound: isSilent ? null : ADHAN_SOUND,
        data: {
          notificationId: id,
          soundType: sound,
          scheduledTime: triggerDate.getTime(),
        },
        priority: Platform.OS === 'android'
          ? Notifications.AndroidNotificationPriority.HIGH
          : undefined,
        categoryIdentifier: 'prayer_reminder',
        ...(Platform.OS === 'android' && { channelId: isSilent ? SILENT_CHANNEL : ADHAN_CHANNEL }),
      };

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      };

      // Deterministic identifier so cancelNotification(id) works
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

  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`❌ Cancelled notification: ${identifier}`);
    } catch (error) {
      console.error(`Error cancelling notification "${identifier}":`, error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async createNotificationChannel(id, name, description) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(id, {
        name,
        description,
        importance: Notifications.AndroidImportance.MAX,
        sound: null,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
      console.log(`✅ Created notification channel: ${id}`);
    }
  }

  // Caller localizes title/body so the notification stays in one language
  async showPersistentCountdown(title, body, prayer) {
    try {
      // Stable identifier — re-scheduling replaces the tray notification instead of stacking
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
        trigger: null,
      });

      console.log(`📊 Updated persistent countdown: ${prayer || ''}`);
    } catch (error) {
      console.error('Error showing persistent countdown:', error);
    }
  }

  async hidePersistentCountdown() {
    try {
      await Notifications.dismissNotificationAsync('prayer-countdown-persistent');
      console.log('🚫 Hidden persistent countdown notification');
    } catch (error) {
      console.error('Error hiding persistent countdown:', error);
    }
  }

  async ensurePermission() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') return true;
      const { status: requested } = await Notifications.requestPermissionsAsync();
      return requested === 'granted';
    } catch (error) {
      console.error('Error ensuring notification permission:', error);
      return false;
    }
  }
}

Object.assign(NotificationService.prototype, permissionMethods);

const notificationService = new NotificationService();
export default notificationService;
