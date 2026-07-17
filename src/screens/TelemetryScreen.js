import React, { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useColors } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import CustomHeader from '@/components/CustomHeader';
import { SettingsContainer, SettingsSection, SettingsRow, SettingsToggle } from '@/components/settings';
import { SPACING } from '@/constants/settingsTokens';
import { isTelemetryEnabled, setTelemetryEnabled, getTelemetryCategories, setTelemetryCategory } from '@/utils/firebase/telemetry';

export default function TelemetryScreen({ navigation }) {
  const colors = useColors();
  const [enabled, setEnabled] = useState(isTelemetryEnabled());
  const [prefs, setPrefs] = useState(getTelemetryCategories());

  const applyMaster = (next) => {
    setEnabled(next);
    setTelemetryEnabled(next);
  };

  const applyCategory = (category, next) => {
    setPrefs((prev) => ({ ...prev, [category]: next }));
    setTelemetryCategory(category, next);
  };

  const confirmDisable = (message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('telemetry.optOutTitle')}\n\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(t('telemetry.optOutTitle'), message, [
      { text: t('telemetry.optOutKeep'), style: 'cancel' },
      { text: t('telemetry.optOutConfirm'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleMasterToggle = (next) => {
    if (next) {
      applyMaster(true);
      return;
    }
    confirmDisable(t('telemetry.optOutMessage'), () => applyMaster(false));
  };

  const handleCategoryToggle = (category) => (next) => {
    if (next) {
      applyCategory(category, true);
      return;
    }
    confirmDisable(t(`telemetry.${category}Plea`), () => applyCategory(category, false));
  };

  const categoryToggle = (category, testID) => (
    <SettingsToggle
      testID={testID}
      value={enabled && prefs[category]}
      disabled={!enabled}
      onValueChange={handleCategoryToggle(category)}
    />
  );

  const bodyText = {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    lineHeight: 24,
    padding: SPACING.lg,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="telemetry-screen-root">
      <CustomHeader navigation={navigation} title={t('telemetry.title')} />

      <SettingsContainer>
        <SettingsSection>
          <Text style={bodyText}>{t('telemetry.intro')}</Text>
        </SettingsSection>

        <SettingsSection title={t('telemetry.collected')}>
          <SettingsRow
            icon="monitor"
            label={t('telemetry.collectedScreens')}
            description={t('telemetry.collectedScreensDesc')}
            trailing={categoryToggle('screens', 'telemetry-screens-toggle')}
          />
          <SettingsRow
            icon="activity"
            label={t('telemetry.collectedEvents')}
            description={t('telemetry.collectedEventsDesc')}
            trailing={categoryToggle('events', 'telemetry-events-toggle')}
          />
          <SettingsRow
            icon="smartphone"
            label={t('telemetry.collectedDevice')}
            description={t('telemetry.collectedDeviceDesc')}
            trailing={categoryToggle('device', 'telemetry-device-toggle')}
          />
          <SettingsRow
            icon="globe"
            label={t('telemetry.collectedAuto')}
            description={t('telemetry.collectedAutoDesc')}
          />
        </SettingsSection>

        <SettingsSection title={t('telemetry.notCollected')}>
          <Text style={bodyText}>{t('telemetry.notCollectedBody')}</Text>
        </SettingsSection>

        <SettingsSection title={t('telemetry.why')}>
          <Text style={bodyText}>{t('telemetry.whyBody')}</Text>
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t('telemetry.toggle')}
            description={t('telemetry.toggleDesc')}
            trailing={(
              <SettingsToggle
                testID="telemetry-toggle"
                value={enabled}
                onValueChange={handleMasterToggle}
              />
            )}
          />
        </SettingsSection>
      </SettingsContainer>
    </View>
  );
}
