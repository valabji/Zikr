import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const DOWNLOAD_CHANNEL = 'quran_downloads';

export async function showDownloadProgress(id, title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: null,
        sticky: true,
        autoDismiss: false,
        priority: Platform.OS === 'android'
          ? Notifications.AndroidNotificationPriority.LOW
          : undefined,
        ...(Platform.OS === 'android' && { channelId: DOWNLOAD_CHANNEL }),
        data: { type: 'quran-download' },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing download progress:', error);
  }
}

export async function hideDownloadProgress(id) {
  try {
    await Notifications.dismissNotificationAsync(id);
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('Error hiding download progress:', error);
  }
}
