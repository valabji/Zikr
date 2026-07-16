import React, { useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useColors } from '@/constants/Colors';
import { t, isRTL } from '@/locales/i18n';
import CHeader from '@/components/CHeader';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { SPACING, CONTENT_MAX_WIDTH } from '@/constants/settingsTokens';
import { getPrayerIcon } from '@/utils/PrayerUtils';
import { getAdhanById } from '@/constants/AdhanCatalog';
import { useTestedMode } from '@/utils/TestedMode';
import { usePrayerSettings } from '@/hooks/usePrayerSettings';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { usePrayerNotificationSettings } from '@/hooks/usePrayerNotificationSettings';
import { usePrayerSettingsSave } from '@/hooks/usePrayerSettingsSave';
import PrayerLocationSection from '@/components/PrayerLocationSection';
import AdhanPickerModal from '@/components/AdhanPickerModal';
import {
  SettingsContainer, SettingsSection, SettingsRow,
  SettingsToggle, SettingsButton, SettingsCallout, SettingsSelect,
} from '@/components/settings';

const AUDIO_MODES = [
  { id: 'none', labelEn: 'Silent (No Sound)', labelAr: 'صامت (بدون صوت)', descriptionEn: 'Show the reminder with no sound', descriptionAr: 'يعرض التذكير بدون صوت' },
  { id: 'short', labelEn: 'Short Alert', labelAr: 'تنبيه قصير', descriptionEn: 'Plays a short takbir when the prayer time arrives', descriptionAr: 'يشغّل تكبيرًا قصيرًا عند دخول وقت الصلاة' },
  { id: 'full', labelEn: 'Full Adhan', labelAr: 'أذان كامل', descriptionEn: 'Short takbir on arrival; tap the notification for the full adhan', descriptionAr: 'تكبير قصير عند الوصول، اضغط على الإشعار لسماع الأذان كاملاً' },
];

export default function UnifiedPrayerSettingsScreen({ navigation }) {
  const colors = useColors();
  const testedMode = useTestedMode();

  const prayer = usePrayerSettings();
  const { location, calculationMethod, setCalculationMethod, madhab, setMadhab } = prayer;
  const [selectedLocation, setSelectedLocation] = useState(null);
  const search = useLocationSearch(setSelectedLocation);
  const notif = usePrayerNotificationSettings();
  const {
    notificationsEnabled, audioMode, setAudioMode, selectedAdhan, adhanState,
    notificationTimes, hasExactAlarm, showPersistentCountdown, setShowPersistentCountdown,
    handleNotificationsToggle, handleAdhanSelection,
    togglePrayer, openExactAlarmSettings, openBatterySettings, sendTestNotification,
  } = notif;

  const [isAdhanModalVisible, setAdhanModalVisible] = useState(false);
  const { handleSave, canSave } = usePrayerSettingsSave({ navigation, prayer, notif, selectedLocation });

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

  const footer = (
    <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: SPACING.lg }}>
      <SettingsButton
        fullWidth
        icon="save"
        label={t('common.save')}
        onPress={handleSave}
        disabled={!canSave}
        testID="prayer-settings-save"
      />
    </View>
  );

  return (
    <View testID="unified-prayer-settings-screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <CHeader navigation={navigation} title={t('prayerSettings.title')} />

      <SettingsContainer footer={footer}>
        <PrayerLocationSection
          location={location}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          search={search}
        />

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
            {Object.keys(notificationTimes).map((prayerName) => (
              <SettingsRow
                key={prayerName}
                icon={getPrayerIcon(prayerName)}
                label={t(`prayerTimes.${prayerName}`)}
                trailing={(
                  <SettingsToggle
                    value={notificationTimes[prayerName]}
                    onValueChange={(enabled) => togglePrayer(prayerName, enabled)}
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

      <AdhanPickerModal
        visible={isAdhanModalVisible}
        onClose={() => setAdhanModalVisible(false)}
        selectedAdhan={selectedAdhan}
        adhanState={adhanState}
        onSelect={(id) => {
          handleAdhanSelection(id);
          setAdhanModalVisible(false);
        }}
      />
    </View>
  );
}
