import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, ScrollView, I18nManager, Alert, BackHandler, Image, ImageBackground, TouchableOpacity, Platform } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, useIsBrightTheme } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getRTLTextAlign, getDirectionalSpacing } from '../locales/i18n';
import { Feather } from '@expo/vector-icons';
import Azkar from '../constants/Azkar.js';
import Swiper from 'react-native-swiper'
// Try different import approach for web swiper
let WebSwiper;
if (Platform.OS === 'web') {
  try {
    WebSwiper = require('react-native-web-swiper').default;
  } catch (error) {
    console.warn('Failed to load react-native-web-swiper:', error);
    WebSwiper = Swiper; // Fallback to regular swiper
  }
}
import { useAudio } from '../utils/Sounds.js';
import { BackgroundSvg1 } from '../components/BackgroundSvg1';
import { StarSvgFilled } from '../components/StarSvg';
import { getFontSize } from '../utils/FontSize';
import { useFocusEffect } from '@react-navigation/native';

// import {
//   AdMobBanner,
//   AdMobInterstitial,
//   PublisherBanner,
//   AdMobRewarded,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

const Banner = "ca-app-pub-1740754568229700/6853520443"
const Interstatel = "ca-app-pub-1740754568229700/7975030420"


export default function Screen2({ route, navigation }) {
  const colors = useColors();
  const name = route?.params?.name || "Azkar";
  const player = useAudio();
  const reverse = isRTL();
  const [zikrFontSize, setZikrFontSize] = React.useState(18);

  let swp = React.createRef();;
  let size = 0;

  // Choose the appropriate swiper based on platform
  const SwiperComponent = Platform.OS === 'web' ? (WebSwiper || Swiper) : Swiper;

  // Load font size when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadFontSize = async () => {
        const fontSize = await getFontSize();
        setZikrFontSize(fontSize);
      };
      loadFontSize();
    }, [])
  );

  const Item = ({ z, pn }) => {
    if (z.count == 0 || z.count == "" || z.count == null || z.count == undefined) {
      z.count = 1
    }
    const [i, setI] = React.useState(0)
    return <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (i < z.count) {
            player.playClick();
            setI(i + 1)
            if (i == z.count - 1) {
              if (Platform.OS === 'web') {
                // react-native-web-swiper uses different method
                if (reverse) {
                let next = size-pn-1
                swp?.goTo?.(next);
                }else{
                swp?.goTo?.(pn);
                }
              } else {
                // react-native-swiper
              const scrollBy = reverse ? -1 : 1;
                swp?.scrollBy?.(scrollBy, true);
              }
            }
          }
        }}
        style={{ height: "100%" }}>
                <Text style={[
          textStyles.bodySmall,
          {
            color: colors.BYellow,
            marginTop: 6,
            fontSize: zikrFontSize,
            textAlign: getRTLTextAlign('left'),
            writingDirection: isRTL() ? "rtl" : "ltr"
          }
        ]}>{z.zekr}</Text>
        <View style={{ borderTopWidth: 1, marginTop: 20, height: 1, width: "100%", borderColor: colors.BYellow, borderStyle: "solid" }} />
        {z.reference != "" &&
          <Text style={[
            textStyles.bodySmall,
            {
              color: colors.BYellow,
              marginTop: 26,
            }
          ]}>{t('zikr.reference', { text: z.reference })}</Text>}
        <Text style={[
          textStyles.bodySmall,
          {
            color: colors.BYellow,
            marginTop: 6,
          }
        ]}>{z.description}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ borderTopWidth: 0, height: 0, width: "100%", borderStyle: "dotted" }} />
        <View style={{ flex: 1 }} />
        <View style={{ height: 96, flexDirection: "row-reverse" }}>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}

          >
            <Text
              style={[
                textStyles.body,
                {
                  textAlign: "right",
                  color: colors.BYellow,
                  fontSize: 18,
                }
              ]}
            >{t('counter.page', { current: pn, total: size })}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ width: 96, height: 96, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
            <StarSvgFilled width={96} height={96} />
            <Text
              testID="count-button"
              style={[
                textStyles.body,
                {
                  position: 'absolute',
                  color: colors.primary,
                  fontSize: 18,
                  fontWeight: 'bold',
                }
              ]}
            >{i} / {z.count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  }

  const azkarList = Azkar.filter(i => i.category == name);
  size = azkarList.length;

  // Debug logging for web platform
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Running on web platform');
      console.log('WebSwiper loaded:', !!WebSwiper);
      console.log('WebSwiper === Swiper:', WebSwiper === Swiper);
      console.log('Using component:', SwiperComponent.name || 'Unknown');
      console.log('Azkar list length:', size);
    }
  }, []);

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
        <Text style={[
          textStyles.bodySmall,
          {
            color: colors.BYellow,
          }
        ]}>
          {t('navigation.helpImprove')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, flexGrow: 1, backgroundColor: colors.BGreen }} testID="screen2-container">
      <BackgroundSvg1 color={colors.BYellow} />
      <CustomHeader title={name} isHome={false} navigation={navigation} Left={ContributionButton} />
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
        <SwiperComponent 
          ref={(ref) => { swp = ref; }}
          style={Platform.OS === 'web' ? { 
            flex: 1, 
            width: '100%', 
            height: '100%',
            minWidth: 300,
            minHeight: 400
          } : {}} 
          loop={false} 
          showsButtons={false} 
          showsPagination={false}
          // Only apply web-specific props if we're using WebSwiper successfully
          {...(Platform.OS === 'web' && WebSwiper && WebSwiper !== Swiper && {
            controlsEnabled: false,
            swipeControlsEnabled: true,
            from: reverse ? size - 1 : 0,
            containerStyle: {
              width: '100%',
              height: '100%',
              flex: 1
            }
          })}
          {...(Platform.OS !== 'web' && {
            onContentSizeChange: () => {
              if (reverse) {
                const scrollBy = size
                swp?.scrollBy?.(scrollBy, false);
              }
            }
          })}
        >
          {azkarList.map((i, index) => {
            const slideContent = (
              <View style={{
                flex: 1, borderWidth: 1, borderColor: colors.BYellow, margin: 7, borderStyle: "dashed", padding: 10, borderRadius: 10
              }}>
                <Item z={i} pn={index + 1} />
              </View>
            );

            return (
              <View key={index} style={{ 
                flex: 1,
                ...(Platform.OS === 'web' && {
                  width: '100%',
                  minWidth: 300,
                  height: '100%'
                })
              }} testID="azkar-item">
                {slideContent}
              </View>
            );
          })}
        </SwiperComponent>
      </View>
    </View>
  );
}
