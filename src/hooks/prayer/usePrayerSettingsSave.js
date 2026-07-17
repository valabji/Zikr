import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { SELECTED_ADHAN_KEY } from '@/constants/AdhanCatalog';
import PrayerCountdownService from '@/utils/prayer/PrayerCountdownService';
import PrayerNotificationScheduler from '@/utils/prayer/PrayerNotificationScheduler';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export function usePrayerSettingsSave({ navigation, prayer, notif, selectedLocation }) {
  const { location, setLocation, calculationMethod, madhab, loadPrayerSettings } = prayer;
  const {
    notificationsEnabled, audioMode, selectedAdhan, notificationTimes,
    showPersistentCountdown, loadNotificationSettings,
  } = notif;

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await loadPrayerSettings();
        await loadNotificationSettings();
      } catch (error) {
        console.error('Error loading settings:', error);
      }
      setSettingsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (settingsLoaded && !baseline) {
      setBaseline({
        location,
        calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan,
        notificationTimes: { ...notificationTimes }, showPersistentCountdown,
      });
    }
  }, [settingsLoaded, baseline, location, calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan, notificationTimes, showPersistentCountdown]);

  const hasUnsavedChanges = useCallback(() => {
    if (!baseline) return false;
    if (selectedLocation) {
      if (!baseline.location) return true;
      if (selectedLocation.latitude !== baseline.location.latitude || selectedLocation.longitude !== baseline.location.longitude) return true;
    }
    return calculationMethod !== baseline.calculationMethod
      || madhab !== baseline.madhab
      || notificationsEnabled !== baseline.notificationsEnabled
      || audioMode !== baseline.audioMode
      || selectedAdhan !== baseline.selectedAdhan
      || JSON.stringify(notificationTimes) !== JSON.stringify(baseline.notificationTimes)
      || showPersistentCountdown !== baseline.showPersistentCountdown;
  }, [baseline, selectedLocation, calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan, notificationTimes, showPersistentCountdown]);

  const saveAllSettings = useCallback(async () => {
    if (!selectedLocation && !location) {
      Alert.alert(t('locationSettings.error'), t('locationSettings.noLocationSelected'));
      return false;
    }
    try {
      if (selectedLocation) {
        await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION, JSON.stringify(selectedLocation));
        setLocation(selectedLocation);
      }
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD, calculationMethod);
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB, madhab);
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled.toString());
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.AUDIO_MODE, audioMode);
      await AsyncStorage.setItem(SELECTED_ADHAN_KEY, selectedAdhan);
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS, JSON.stringify(notificationTimes));
      await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.PERSISTENT_COUNTDOWN, showPersistentCountdown.toString());

      await PrayerCountdownService.stop();
      if (showPersistentCountdown) await PrayerCountdownService.start();
      await PrayerNotificationScheduler.refresh();

      setBaseline({
        location: selectedLocation || location,
        calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan,
        notificationTimes: { ...notificationTimes }, showPersistentCountdown,
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(t('common.error'), t('prayerSettings.saveError'));
      return false;
    }
  }, [selectedLocation, location, calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan, notificationTimes, showPersistentCountdown, setLocation]);

  const { skipGuard } = useUnsavedChangesGuard(navigation, hasUnsavedChanges, saveAllSettings);

  const handleSave = async () => {
    if (await saveAllSettings()) {
      skipGuard();
      Alert.alert(
        t('common.success'),
        t('prayerSettings.saveSuccess'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    }
  };

  return { handleSave, canSave: !!(selectedLocation || location) };
}
