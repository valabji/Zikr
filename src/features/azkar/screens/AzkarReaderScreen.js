import * as React from 'react';
import AppHeader from '../../../common/components/AppHeader'
import { Text, View, SafeAreaView, Dimensions, ScrollView, I18nManager, Alert, BackHandler, Image, ImageBackground, TouchableOpacity, Platform } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, useIsBrightTheme } from "../../../core/theme/Colors";
import { textStyles } from '../../../core/theme/Fonts';
import { t, isRTL, getRTLTextAlign, getDirectionalSpacing } from '../../../core/i18n/i18n';
import { Feather } from '@expo/vector-icons';
import Azkar from '../constants/Azkar.js';
import AzkarSwiper from '../components/AzkarSwiper';
import AzkarOnePageScroll from '../components/AzkarOnePageScroll';
import { useAudio } from '../../../common/utils/AudioManager';
import { AzkarBackground } from '../../../common/components/AzkarBackground';
import { getFontSize } from '../../../common/utils/FontSizeManager';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// import {
//   AdMobBanner,
//   AdMobInterstitial,
//   PublisherBanner,
//   AdMobRewarded,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

const Banner = "ca-app-pub-1740754568229700/6853520443"
const Interstatel = "ca-app-pub-1740754568229700/7975030420"


export default function AzkarReaderScreen({ route, navigation }) {
  const colors = useColors();
  const name = route?.params?.name || "Azkar";
  const player = useAudio();
  const reverse = isRTL();
  const [zikrFontSize, setZikrFontSize] = React.useState(18);
  const [viewMode, setViewMode] = React.useState('swiper');

  // Load font size and view mode when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadSettings = async () => {
        const [fontSize, savedViewMode] = await Promise.all([
          getFontSize(),
          AsyncStorage.getItem('@viewMode')
        ]);
        setZikrFontSize(fontSize);
        setViewMode(savedViewMode || 'swiper');
      };
      loadSettings();
    }, [])
  );

  const azkarList = Azkar.filter(i => i.category == name);

  // Contribution button component for header
  const ContributionButton = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Contribute')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          ...getDirectionalSpacing(0, 20),
        }}
      >
        <Feather
          name="edit"
          size={20}
          color={colors.BYellow}
          style={{ marginRight: isRTL() ? 0 : 5, marginLeft: isRTL() ? 5 : 0 }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, flexGrow: 1, backgroundColor: colors.BGreen }} testID="screen2-container">
      <AzkarBackground color={colors.BYellow} />
      <AppHeader title={name} isHome={false} navigation={navigation} Left={ContributionButton} />
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh'
        })
      }}>
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
        {viewMode === 'swiper' ? (
          <AzkarSwiper azkarList={azkarList} zikrFontSize={zikrFontSize} />
        ) : (
          <AzkarOnePageScroll azkarList={azkarList} zikrFontSize={zikrFontSize} />
        )}
      </View>
    </View>
  );
}
