import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BATTERY_CHECK_KEY = 'lastBatteryCheck';

export const permissionMethods = {
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

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
  },

  // Android 12+: without SCHEDULE_EXACT_ALARM, notifications can be delayed 15-30 min by Doze
  async checkExactAlarmPermission() {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        // expo-notifications can't read SCHEDULE_EXACT_ALARM; notification permission is the best proxy
        const hasPermission = await Notifications.getPermissionsAsync();
        const canScheduleExact = hasPermission.granted;
        if (!canScheduleExact) {
          console.warn('Notification permission not granted');
        }
        return canScheduleExact;
      }

      return true;

    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return false;
    }
  },

  async openExactAlarmSettings() {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Required', 'Exact alarms are only needed on Android.');
      return;
    }

    try {
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
  },

  // No Expo API for battery-optimization status; heuristic nudges a settings check every 24h
  async checkBatteryOptimization() {
    if (Platform.OS !== 'android') return false;

    try {
      const lastCheck = await AsyncStorage.getItem(LAST_BATTERY_CHECK_KEY);
      const now = Date.now();

      if (!lastCheck) {
        await AsyncStorage.setItem(LAST_BATTERY_CHECK_KEY, now.toString());
        return false;
      }

      const hoursSinceCheck = (now - parseInt(lastCheck)) / (1000 * 60 * 60);
      return hoursSinceCheck > 24;

    } catch (error) {
      console.error('Error checking battery optimization:', error);
      return false;
    }
  },

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
  },
};
