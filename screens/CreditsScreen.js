import React from 'react';
import { View, Text, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import { useRTL } from '../hooks/useRTL';
import CHeader from '../components/CHeader';
import { DATA_SOURCES, LICENSES } from '../constants/AboutConstants';
import { SettingsContainer, SettingsSection, SettingsRow } from '../components/settings';
import { SPACING, RADIUS } from '../constants/settingsTokens';

export default function CreditsScreen({ navigation }) {
  const colors = useColors();
  const { getTextAlign, getDirectionalMixedSpacing } = useRTL();

  const openUrl = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert(t('about.error'), t('about.linkError'));
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="credits-screen-root">
      <CHeader navigation={navigation} title={t('credits.title')} />

      <SettingsContainer>
        <SettingsSection>
          <Text style={{
            color: colors.text,
            fontSize: 15,
            fontFamily: 'Cairo_400Regular',
            lineHeight: 24,
            padding: SPACING.lg,
            textAlign: getTextAlign('left'),
          }}>{t('credits.intro')}</Text>
        </SettingsSection>

        <SettingsSection title={t('credits.dataSources')}>
          {DATA_SOURCES.map((src) => (
            <SettingsRow
              key={src.roleKey}
              testID={`credit-source-${src.roleKey}`}
              label={t(`credits.sourceNames.${src.roleKey}`)}
              description={t(`credits.sources.${src.roleKey}`)}
              trailing={src.url ? <Feather name="external-link" size={18} color={colors.accent} /> : null}
              onPress={src.url ? () => openUrl(src.url) : undefined}
            />
          ))}
        </SettingsSection>

        <SettingsSection title={t('credits.licenses')}>
          {LICENSES.map((lib, i) => (
            <SettingsRow
              key={lib.name}
              testID={`credit-license-${i}`}
              label={lib.name}
              trailing={
                <Text style={{
                  color: colors.primary,
                  backgroundColor: colors.accent,
                  fontSize: 11,
                  fontFamily: 'Cairo_400Regular',
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: 2,
                  borderRadius: RADIUS.control,
                  overflow: 'hidden',
                }}>{lib.license}</Text>
              }
              onPress={lib.url ? () => openUrl(lib.url) : undefined}
            />
          ))}
        </SettingsSection>

        <SettingsSection title={t('credits.thanks')}>
          <Text style={{
            color: colors.text,
            fontSize: 15,
            fontFamily: 'Cairo_400Regular',
            lineHeight: 24,
            padding: SPACING.lg,
            textAlign: getTextAlign('left'),
          }}>{t('credits.thanksBody')}</Text>
        </SettingsSection>
      </SettingsContainer>
    </View>
  );
}
