import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert, Share } from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import { useRTL } from '../hooks/useRTL';
import CHeader from '../components/CHeader';
import { LogoSvg } from '../components/LogoSvg';
import { ABOUT_LINKS } from '../constants/AboutConstants';
import { SettingsContainer, SettingsSection, SettingsRow } from '../components/settings';
import { SPACING, webCursor } from '../constants/settingsTokens';

export default function AboutScreen({ navigation }) {
  const colors = useColors();
  const { getTextAlign, getDirectionalMixedSpacing } = useRTL();
  const version = Constants.expoConfig?.version || '';
  const year = new Date().getFullYear();

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('about.error'), t('about.linkError'));
    });
  };

  const shareApp = () => {
    Share.share({ message: t('share.message') });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="about-screen-root">
      <CHeader navigation={navigation} title={t('about.title')} />

      <SettingsContainer>
        <SettingsSection>
          <View style={{ alignItems: 'center', padding: SPACING.xl }}>
            <LogoSvg color={colors.accent} spacing={80} width={110} height={128} />
            <Text style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '600',
              fontFamily: 'Cairo_400Regular',
              marginTop: SPACING.sm,
            }}>{t('app.name')}</Text>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontFamily: 'Cairo_400Regular',
              marginBottom: SPACING.md,
            }}>{t('about.version', { version })}</Text>
            <Text style={{
              color: colors.text,
              fontSize: 15,
              fontFamily: 'Cairo_400Regular',
              lineHeight: 24,
              textAlign: 'center',
            }}>{t('about.description')}</Text>
          </View>
        </SettingsSection>

        <SettingsSection title={t('about.developer')}>
          <View style={[{ flexDirection: 'row', alignItems: 'center', padding: SPACING.lg }]}>
            <Image
              source={require('../assets/images/developer.jpg')}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface }}
            />
            <View style={{ flex: 1, ...getDirectionalMixedSpacing({ marginLeft: 14, marginRight: 14 }) }}>
              <Text style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: '600',
                fontFamily: 'Cairo_400Regular',
                textAlign: getTextAlign('left'),
              }}>{t('about.developerName')}</Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 13,
                fontFamily: 'Cairo_400Regular',
                marginTop: 2,
                textAlign: getTextAlign('left'),
              }}>{t('about.developerRole')}</Text>
              <TouchableOpacity
                testID="about-developer-link"
                accessibilityRole="link"
                onPress={() => openUrl(ABOUT_LINKS.DEVELOPER)}
                style={[{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm }, webCursor]}
              >
                <Feather name="external-link" size={14} color={colors.accent} />
                <Text style={{
                  color: colors.accent,
                  fontSize: 13,
                  fontFamily: 'Cairo_400Regular',
                  textDecorationLine: 'underline',
                  ...getDirectionalMixedSpacing({ marginLeft: 6 }),
                }}>{t('about.developerLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title={t('about.links')}>
          <SettingsRow testID="about-link-website" icon="globe" label={t('about.website')} trailing={<Feather name="external-link" size={18} color={colors.accent} />} onPress={() => openUrl(ABOUT_LINKS.WEBSITE)} />
          <SettingsRow testID="about-link-github" icon="github" label={t('about.github')} trailing={<Feather name="external-link" size={18} color={colors.accent} />} onPress={() => openUrl(ABOUT_LINKS.GITHUB)} />
          <SettingsRow testID="about-link-playstore" icon="play" label={t('about.playStore')} trailing={<Feather name="external-link" size={18} color={colors.accent} />} onPress={() => openUrl(ABOUT_LINKS.PLAY_STORE)} />
          <SettingsRow testID="about-link-share" icon="share-2" label={t('about.shareApp')} trailing={<Feather name="external-link" size={18} color={colors.accent} />} onPress={shareApp} />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            testID="about-contribute-link"
            icon="help-circle"
            label={t('about.contribute')}
            description={t('about.contributeDesc')}
            chevron
            onPress={() => navigation.navigate('Contribute')}
          />
          <SettingsRow
            testID="about-credits-link"
            icon="award"
            label={t('about.creditsLink')}
            description={t('about.creditsLinkDesc')}
            chevron
            onPress={() => navigation.navigate('Credits')}
          />
        </SettingsSection>

        <Text style={{
          color: colors.textSecondary,
          fontSize: 13,
          fontFamily: 'Cairo_400Regular',
          textAlign: 'center',
          marginBottom: SPACING.xs,
        }}>{t('about.rights', { year })}</Text>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 13,
          fontFamily: 'Cairo_400Regular',
          textAlign: 'center',
        }}>{t('about.madeWith')}</Text>
      </SettingsContainer>
    </View>
  );
}
