import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Linking, Alert, Share } from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { LogoSvg } from '../components/LogoSvg';
import { ABOUT_LINKS } from '../constants/AboutConstants';

export default function AboutScreen({ navigation }) {
  const colors = useColors();
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

  const card = {
    backgroundColor: colors.DGreen,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
  };

  const heading = {
    color: colors.BYellow,
    fontSize: 18,
    fontFamily: 'Cairo_400Regular',
    marginBottom: 12,
    textAlign: getRTLTextAlign('left'),
  };

  const LinkRow = ({ icon, label, onPress, testID }) => (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.BGreen,
        borderRadius: 10,
        padding: 14,
        marginTop: 8,
      }}
    >
      <Feather name={icon} size={20} color={colors.BYellow} />
      <Text style={{
        color: colors.BYellow,
        fontSize: 16,
        fontFamily: 'Cairo_400Regular',
        flex: 1,
        textAlign: getRTLTextAlign('left'),
        ...getDirectionalMixedSpacing({ marginLeft: 12 }),
      }}>{label}</Text>
      <Feather name="external-link" size={18} color={colors.BYellow} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="about-screen-root">
      <CHeader navigation={navigation} title={t('about.title')} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={[card, { alignItems: 'center' }]}>
          <LogoSvg color={colors.BYellow} spacing={80} width={110} height={128} />
          <Text style={{
            color: colors.BYellow,
            fontSize: 24,
            fontWeight: '600',
            fontFamily: 'Cairo_400Regular',
            marginTop: 8,
          }}>{t('app.name')}</Text>
          <Text style={{
            color: colors.BYellow,
            fontSize: 13,
            fontFamily: 'Cairo_400Regular',
            opacity: 0.8,
            marginBottom: 14,
          }}>{t('about.version', { version })}</Text>
          <Text style={{
            color: colors.BYellow,
            fontSize: 15,
            fontFamily: 'Cairo_400Regular',
            lineHeight: 24,
            textAlign: 'center',
          }}>{t('about.description')}</Text>
        </View>

        <View style={card}>
          <Text style={heading}>{t('about.developer')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../assets/images/developer.jpg')}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.BGreen }}
            />
            <View style={{ flex: 1, ...getDirectionalMixedSpacing({ marginLeft: 14, marginRight: 14 }) }}>
              <Text style={{
                color: colors.BYellow,
                fontSize: 17,
                fontWeight: '600',
                fontFamily: 'Cairo_400Regular',
                textAlign: getRTLTextAlign('left'),
              }}>{t('about.developerName')}</Text>
              <Text style={{
                color: colors.BYellow,
                fontSize: 13,
                fontFamily: 'Cairo_400Regular',
                opacity: 0.8,
                marginTop: 2,
                textAlign: getRTLTextAlign('left'),
              }}>{t('about.developerRole')}</Text>
              <TouchableOpacity
                testID="about-developer-link"
                onPress={() => openUrl(ABOUT_LINKS.DEVELOPER)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
              >
                <Feather name="external-link" size={14} color={colors.BYellow} />
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 13,
                  fontFamily: 'Cairo_400Regular',
                  textDecorationLine: 'underline',
                  ...getDirectionalMixedSpacing({ marginLeft: 6 }),
                }}>{t('about.developerLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={card}>
          <Text style={heading}>{t('about.links')}</Text>
          <LinkRow testID="about-link-website" icon="globe" label={t('about.website')} onPress={() => openUrl(ABOUT_LINKS.WEBSITE)} />
          <LinkRow testID="about-link-github" icon="github" label={t('about.github')} onPress={() => openUrl(ABOUT_LINKS.GITHUB)} />
          <LinkRow testID="about-link-playstore" icon="play" label={t('about.playStore')} onPress={() => openUrl(ABOUT_LINKS.PLAY_STORE)} />
          <LinkRow testID="about-link-share" icon="share-2" label={t('about.shareApp')} onPress={shareApp} />
        </View>

        <TouchableOpacity
          testID="about-credits-link"
          onPress={() => navigation.navigate('Credits')}
          style={[card, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}
        >
          <Feather name="award" size={24} color={colors.BYellow} />
          <View style={{ flex: 1, ...getDirectionalMixedSpacing({ marginLeft: 14, marginRight: 14 }) }}>
            <Text style={{
              color: colors.BYellow,
              fontSize: 16,
              fontFamily: 'Cairo_400Regular',
              textAlign: getRTLTextAlign('left'),
            }}>{t('about.creditsLink')}</Text>
            <Text style={{
              color: colors.BYellow,
              fontSize: 13,
              fontFamily: 'Cairo_400Regular',
              opacity: 0.8,
              marginTop: 2,
              textAlign: getRTLTextAlign('left'),
            }}>{t('about.creditsLinkDesc')}</Text>
          </View>
          <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={24} color={colors.BYellow} />
        </TouchableOpacity>

        <Text style={{
          color: colors.BYellow,
          fontSize: 13,
          fontFamily: 'Cairo_400Regular',
          textAlign: 'center',
          opacity: 0.85,
          marginBottom: 4,
        }}>{t('about.rights', { year })}</Text>
        <Text style={{
          color: colors.BYellow,
          fontSize: 13,
          fontFamily: 'Cairo_400Regular',
          textAlign: 'center',
          fontStyle: 'italic',
          opacity: 0.7,
          marginBottom: 24,
        }}>{t('about.madeWith')}</Text>
      </ScrollView>
    </View>
  );
}
