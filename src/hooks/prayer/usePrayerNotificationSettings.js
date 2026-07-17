import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import NotificationService from '@/utils/notifications/NotificationService';
import AdhanDownloader from '@/utils/prayer/AdhanDownloader';
import { getAdhanById, SELECTED_ADHAN_KEY, DEFAULT_ADHAN_ID } from '@/constants/AdhanCatalog';

const DEFAULT_PRAYER_TOGGLES = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

export function usePrayerNotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [audioMode, setAudioMode] = useState('short');
  const [selectedAdhan, setSelectedAdhan] = useState(DEFAULT_ADHAN_ID);
  const [adhanState, setAdhanState] = useState({});
  const [notificationTimes, setNotificationTimes] = useState(DEFAULT_PRAYER_TOGGLES);
  const [hasExactAlarm, setHasExactAlarm] = useState(true);
  const [showPersistentCountdown, setShowPersistentCountdown] = useState(false);

  useEffect(() => {
    AdhanDownloader.checkInstalled();
    return AdhanDownloader.subscribe(setAdhanState);
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    const [savedNotifications, savedAudioMode, savedAdhan, savedTimes, savedCountdown] = await Promise.all([
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.AUDIO_MODE),
      AsyncStorage.getItem(SELECTED_ADHAN_KEY),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.PERSISTENT_COUNTDOWN),
    ]);
    setNotificationsEnabled(savedNotifications === 'true');
    if (savedAudioMode) setAudioMode(savedAudioMode);
    if (savedAdhan) setSelectedAdhan(savedAdhan);
    if (savedTimes) setNotificationTimes(JSON.parse(savedTimes));
    setShowPersistentCountdown(savedCountdown === 'true');
    if (Platform.OS === 'android') {
      setHasExactAlarm(await NotificationService.checkExactAlarmPermission());
    }
  }, []);

  const handleNotificationsToggle = async (value) => {
    if (value) {
      const result = await NotificationService.requestPermissions();
      if (!result.granted) {
        Alert.alert(
          t('notifications.permissionRequired'),
          t('notifications.permissionMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }
      if (result.needsExactAlarm && Platform.OS === 'android') {
        Alert.alert(
          t('notifications.exactAlarmRequired'),
          t('notifications.exactAlarmMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('notifications.openSettings'), onPress: () => NotificationService.openExactAlarmSettings() },
          ]
        );
      }
    }
    setNotificationsEnabled(value);
  };

  const handleAdhanSelection = (id) => {
    setSelectedAdhan(id);
    if (!getAdhanById(id).bundled && !AdhanDownloader.isDownloaded(id)) {
      AdhanDownloader.start(id);
    }
  };

  const togglePrayer = (prayer, enabled) => {
    setNotificationTimes(prev => ({ ...prev, [prayer]: enabled }));
  };

  const openExactAlarmSettings = async () => {
    await NotificationService.openExactAlarmSettings();
    setTimeout(async () => {
      setHasExactAlarm(await NotificationService.checkExactAlarmPermission());
    }, 1000);
  };

  const openBatterySettings = () => NotificationService.openBatterySettings();

  const sendTestNotification = async () => {
    try {
      const perm = await NotificationService.requestPermissions();
      if (!perm.granted) {
        Alert.alert('Test notification', 'Notification permission is not granted. Enable it and try again.');
        return;
      }
      if (perm.needsExactAlarm && Platform.OS === 'android') {
        Alert.alert(
          'Exact alarm needed',
          'Grant the exact-alarm permission so the test notification fires on time.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => NotificationService.openExactAlarmSettings() },
          ]
        );
        return;
      }

      const trigger = new Date(Date.now() + 60_000);
      const result = await NotificationService.scheduleExactNotification(
        `prayer-test-${Date.now()}`,
        '🕌 Test adhan',
        `Scheduled to fire at ${trigger.toLocaleTimeString()}`,
        trigger,
        audioMode,
      );
      if (result) {
        Alert.alert(
          'Test scheduled',
          `A test notification (audio mode: ${audioMode}) will fire in 60 seconds. Background the app or wait — if foreground and audio mode is "short", you should hear the short alert. Tap it to play the full adhan.`,
        );
      } else {
        Alert.alert('Test failed', 'Could not schedule the test notification. Check the console for details.');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Test failed', error?.message || 'Unknown error');
    }
  };

  return {
    notificationsEnabled, audioMode, setAudioMode, selectedAdhan, adhanState,
    notificationTimes, hasExactAlarm, showPersistentCountdown, setShowPersistentCountdown,
    loadNotificationSettings, handleNotificationsToggle, handleAdhanSelection,
    togglePrayer, openExactAlarmSettings, openBatterySettings, sendTestNotification,
  };
}
