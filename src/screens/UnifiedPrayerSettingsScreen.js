import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/constants/Colors';
import { t, isRTL, getRTLTextAlign } from '@/locales/i18n';
import { textStyles } from '@/constants/Fonts';
import CHeader from '@/components/CHeader';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha } from '@/constants/settingsTokens';
import { getPrayerIcon } from '@/utils/PrayerUtils';
import PrayerCountdownService from '@/utils/PrayerCountdownService';
import PrayerNotificationScheduler from '@/utils/PrayerNotificationScheduler';
import AdhanDownloader from '@/utils/AdhanDownloader';
import { ADHAN_CATALOG, getAdhanById, SELECTED_ADHAN_KEY } from '@/constants/AdhanCatalog';
import { useTestedMode } from '@/utils/TestedMode';
import { usePrayerSettings } from '@/hooks/usePrayerSettings';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { usePrayerNotificationSettings } from '@/hooks/usePrayerNotificationSettings';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  SettingsContainer, SettingsSection, SettingsRow, SettingsField,
  SettingsToggle, SettingsButton, SettingsCallout, SettingsSelect, SettingsModalShell,
} from '@/components/settings';

const AUDIO_MODES = [
  { id: 'none', labelEn: 'Silent (No Sound)', labelAr: 'صامت (بدون صوت)', descriptionEn: 'Show the reminder with no sound', descriptionAr: 'يعرض التذكير بدون صوت' },
  { id: 'short', labelEn: 'Short Alert', labelAr: 'تنبيه قصير', descriptionEn: 'Plays a short takbir when the prayer time arrives', descriptionAr: 'يشغّل تكبيرًا قصيرًا عند دخول وقت الصلاة' },
  { id: 'full', labelEn: 'Full Adhan', labelAr: 'أذان كامل', descriptionEn: 'Short takbir on arrival; tap the notification for the full adhan', descriptionAr: 'تكبير قصير عند الوصول، اضغط على الإشعار لسماع الأذان كاملاً' },
];

const locationLabel = (loc) => loc.name || `${loc.city}, ${loc.country}`;

export default function UnifiedPrayerSettingsScreen({ navigation }) {
  const colors = useColors();
  const testedMode = useTestedMode();

  const {
    location, setLocation, calculationMethod, setCalculationMethod,
    madhab, setMadhab, loadPrayerSettings,
  } = usePrayerSettings();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const {
    searchQuery, searchResults, isSearching, isGettingLocation,
    handleSearch, getCurrentLocation, getIPLocation,
  } = useLocationSearch(setSelectedLocation);
  const {
    notificationsEnabled, audioMode, setAudioMode, selectedAdhan, adhanState,
    notificationTimes, hasExactAlarm, showPersistentCountdown, setShowPersistentCountdown,
    loadNotificationSettings, handleNotificationsToggle, handleAdhanSelection,
    togglePrayer, openExactAlarmSettings, openBatterySettings, sendTestNotification,
  } = usePrayerNotificationSettings();

  const [isAdhanModalVisible, setAdhanModalVisible] = useState(false);
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

  const calculationMethodOptions = Object.values(PRAYER_CONSTANTS.CALCULATION_METHODS).map((method) => ({
    id: method,
    label: t(`prayerSettings.calculationMethods.${method}`),
  }));
  const madhabOptions = [
    { id: 'Shafi', label: t('prayerSettings.shafiMadhab') },
    { id: 'Hanafi', label: t('prayerSettings.hanafiMadhab') },
  ];
  const audioModeOptions = AUDIO_MODES.map((m) => ({
    id: m.id,
    label: isRTL() ? m.labelAr : m.labelEn,
    sublabel: isRTL() ? m.descriptionAr : m.descriptionEn,
  }));

  const selectedAdhanDownloading = adhanState[selectedAdhan]?.downloading;

  const adhanStatus = (option) => {
    const st = adhanState[option.id];
    if (option.bundled) return isRTL() ? option.reciterAr : option.reciterEn;
    if (st?.downloading) return `${t('settings.notifications.downloading')} ${Math.round((st.progress || 0) * 100)}%`;
    if (st?.downloaded) return t('settings.notifications.downloaded');
    return `${(option.bytes / 1048576).toFixed(1)} MB · ${t('settings.notifications.tapToDownload')}`;
  };

  const footer = (
    <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: SPACING.lg }}>
      <SettingsButton
        fullWidth
        icon="save"
        label={t('common.save')}
        onPress={handleSave}
        disabled={!selectedLocation && !location}
        testID="prayer-settings-save"
      />
    </View>
  );

  return (
    <View testID="unified-prayer-settings-screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <CHeader navigation={navigation} title={t('prayerSettings.title')} />

      <SettingsContainer footer={footer}>
        <SettingsSection title={t('locationSettings.title')}>
          <SettingsRow
            icon="map-pin"
            label={t('locationSettings.currentLocation')}
            value={location ? locationLabel(location) : t('locationSettings.noLocationSet')}
          />
          {selectedLocation && selectedLocation !== location ? (
            <SettingsRow
              icon="navigation"
              label={t('locationSettings.newLocation')}
              value={locationLabel(selectedLocation)}
            />
          ) : null}
          <SettingsField label={t('locationSettings.searchLocation')}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: withAlpha(colors.accent, 'subtle'),
              borderRadius: RADIUS.control,
              paddingHorizontal: SPACING.md,
            }}>
              <Feather name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={[textStyles.body, {
                  flex: 1,
                  color: colors.text,
                  paddingVertical: SPACING.sm + 2,
                  marginHorizontal: SPACING.sm,
                  textAlign: getRTLTextAlign('left'),
                }]}
                placeholder={t('locationSettings.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {isSearching ? <ActivityIndicator size="small" color={colors.accent} /> : null}
            </View>
          </SettingsField>
          {searchResults.map((item, index) => (
            <SettingsRow
              key={`search-${index}`}
              label={item.name}
              description={item.country}
              onPress={() => setSelectedLocation(item)}
              trailing={selectedLocation?.name === item.name
                ? <Feather name="check" size={20} color={colors.accent} />
                : null}
            />
          ))}
          {searchQuery.length >= PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH && !isSearching && searchResults.length === 0 ? (
            <SettingsField description={t('locationSettings.noResultsFound')} />
          ) : null}
          <SettingsRow
            icon="crosshair"
            label={t('locationSettings.useGPS')}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
            trailing={isGettingLocation ? <ActivityIndicator size="small" color={colors.accent} /> : null}
          />
          <SettingsRow
            icon="wifi"
            label={t('locationSettings.useIP')}
            onPress={getIPLocation}
            disabled={isGettingLocation}
            trailing={isGettingLocation ? <ActivityIndicator size="small" color={colors.accent} /> : null}
          />
        </SettingsSection>

        <SettingsSection title={t('prayerSettings.calculationSettingsSection')}>
          <SettingsSelect
            label={t('prayerSettings.calculationMethod')}
            title={t('prayerSettings.calculationMethod')}
            value={calculationMethod}
            options={calculationMethodOptions}
            onChange={setCalculationMethod}
          />
          <SettingsSelect
            label={t('prayerSettings.madhab')}
            title={t('prayerSettings.madhab')}
            value={madhab}
            options={madhabOptions}
            onChange={setMadhab}
          />
        </SettingsSection>

        {Platform.OS === 'android' && Platform.Version >= 31 && !hasExactAlarm ? (
          <View style={{ marginBottom: SPACING.md }}>
            <SettingsCallout
              tone="warning"
              title={t('settings.notifications.exactAlarmRequired')}
              body={t('settings.notifications.exactAlarmMessage')}
              onPress={openExactAlarmSettings}
            />
          </View>
        ) : null}
        {Platform.OS === 'android' ? (
          <View style={{ marginBottom: SPACING.xl }}>
            <SettingsCallout
              tone="info"
              icon="battery"
              title={t('settings.notifications.batteryOptimization')}
              body={t('settings.notifications.batteryMessage')}
              onPress={openBatterySettings}
            />
          </View>
        ) : null}

        <SettingsSection title={t('settings.notifications.title')}>
          <SettingsRow
            label={t('settings.notifications.enabled')}
            description={t('settings.notifications.enabledDescription')}
            trailing={<SettingsToggle value={notificationsEnabled} onValueChange={handleNotificationsToggle} />}
          />
          {notificationsEnabled ? (
            <SettingsSelect
              label={t('settings.notifications.audioMode')}
              title={t('settings.notifications.audioMode')}
              value={audioMode}
              options={audioModeOptions}
              onChange={setAudioMode}
            />
          ) : null}
          {notificationsEnabled && audioMode !== 'none' ? (
            <SettingsRow
              label={t('settings.notifications.adhanRecitation')}
              description={selectedAdhanDownloading
                ? `${t('settings.notifications.downloading')} ${Math.round((adhanState[selectedAdhan]?.progress || 0) * 100)}%`
                : null}
              value={isRTL() ? getAdhanById(selectedAdhan).nameAr : getAdhanById(selectedAdhan).nameEn}
              onPress={() => setAdhanModalVisible(true)}
              chevron={!selectedAdhanDownloading}
              trailing={selectedAdhanDownloading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
            />
          ) : null}
          {notificationsEnabled && testedMode ? (
            <SettingsRow
              icon="play-circle"
              label="🧪 Test notification"
              description="Fire a test adhan in 60 seconds"
              onPress={sendTestNotification}
            />
          ) : null}
        </SettingsSection>

        {notificationsEnabled ? (
          <SettingsSection title={t('settings.notifications.selectPrayers')}>
            {Object.keys(notificationTimes).map((prayer) => (
              <SettingsRow
                key={prayer}
                icon={getPrayerIcon(prayer)}
                label={t(`prayerTimes.${prayer}`)}
                trailing={(
                  <SettingsToggle
                    value={notificationTimes[prayer]}
                    onValueChange={(enabled) => togglePrayer(prayer, enabled)}
                    size={24}
                  />
                )}
              />
            ))}
            <SettingsRow
              label={t('prayerTimes.persistentNotification')}
              description={t('prayerTimes.persistentNotificationDesc')}
              trailing={<SettingsToggle value={showPersistentCountdown} onValueChange={setShowPersistentCountdown} />}
            />
          </SettingsSection>
        ) : null}

        <SettingsCallout
          tone="info"
          title={t('common.prayerTimesDisclaimer')}
          body={t('common.prayerTimesDisclaimerText')}
        />
      </SettingsContainer>

      <SettingsModalShell
        visible={isAdhanModalVisible}
        onClose={() => setAdhanModalVisible(false)}
        title={t('settings.notifications.adhanRecitation')}
      >
        <ScrollView bounces={false}>
          {ADHAN_CATALOG.map((option) => {
            const st = adhanState[option.id];
            const isDownloaded = option.bundled || st?.downloaded;
            return (
              <SettingsRow
                key={option.id}
                label={isRTL() ? option.nameAr : option.nameEn}
                description={adhanStatus(option)}
                labelStyle={selectedAdhan === option.id ? { color: colors.accent, fontWeight: '600' } : null}
                onPress={() => {
                  handleAdhanSelection(option.id);
                  setAdhanModalVisible(false);
                }}
                trailing={(
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {!option.bundled && st?.downloaded ? (
                      <Pressable onPress={() => AdhanDownloader.remove(option.id)} hitSlop={8} style={{ paddingHorizontal: SPACING.sm }}>
                        <Feather name="trash-2" size={18} color={colors.textSecondary} />
                      </Pressable>
                    ) : null}
                    {st?.downloading
                      ? <ActivityIndicator size="small" color={colors.accent} />
                      : selectedAdhan === option.id
                        ? <Feather name="check" size={20} color={colors.accent} />
                        : !isDownloaded
                          ? <Feather name="download" size={20} color={colors.textSecondary} />
                          : null}
                  </View>
                )}
              />
            );
          })}
        </ScrollView>
      </SettingsModalShell>
    </View>
  );
}
