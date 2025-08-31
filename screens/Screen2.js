import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, ScrollView, I18nManager, Alert, BackHandler, Image, ImageBackground, TouchableOpacity } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, useIsBrightTheme } from "../constants/Colors";
import { t } from '../locales/i18n';
import Azkar from '../constants/Azkar.js';
import Swiper from 'react-native-swiper'
import { useAudio } from '../utils/Sounds.js';
import { BackgroundSvg1 } from '../components/BackgroundSvg1';
import { StarSvgFilled } from '../components/StarSvg';

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
  const reverse = I18nManager.isRTL;

  let swp = React.createRef();;
  let size = 0;

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
              const scrollBy = reverse ? -1 : 1;
              swp.scrollBy(scrollBy, true);
            }
          }
        }}
        style={{ height: "100%" }}>
        <Text style={{
          color: colors.BYellow,
          fontSize: 14,
          marginTop: 6,
          fontFamily: "Cairo_400Regular",
          textAlign: "left",
          writingDirection: I18nManager.isRTL ? "rtl" : "ltr"
        }}>{z.zekr}</Text>
        <View style={{ borderTopWidth: 1, marginTop: 20, height: 1, width: "100%", borderColor: colors.BYellow, borderStyle: "solid" }} />
        {z.reference != "" &&
          <Text style={{
            color: colors.BYellow,
            fontSize: 14,
            marginTop: 26,
            fontFamily: "Cairo_400Regular",
          }}>{t('zikr.reference', { text: z.reference })}</Text>}
        <Text style={{
          color: colors.BYellow,
          fontSize: 14,
          marginTop: 6,
          fontFamily: "Cairo_400Regular",
        }}>{z.description}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ borderTopWidth: 0, height: 0, width: "100%", borderStyle: "dotted" }} />
        <View style={{ flex: 1 }} />
        <View style={{ height: 96, flexDirection: "row-reverse" }}>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}

          >
            <Text
              style={{
                textAlign: "right",
                fontFamily: "Cairo_400Regular",
                color: colors.BYellow,
                fontSize: 18,
              }}
            >{t('counter.page', { current: pn, total: size })}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ width: 96, height: 96, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
            <StarSvgFilled width={96} height={96} />
            <Text
              testID="count-button"
              style={{
                position: 'absolute',
                color: colors.primary,
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >{i} / {z.count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  }

  const azkarList = Azkar.filter(i => i.category == name);
  size = azkarList.length;

  return (
    <View style={{ flex: 1, flexGrow: 1, backgroundColor: colors.BGreen }} testID="screen2-container">
      <BackgroundSvg1 color={colors.BYellow} />
      <CustomHeader title={name} isHome={false} navigation={navigation} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
        <Swiper ref={(ref) => { swp = ref; }}
          onContentSizeChange={() => {
            if (reverse) {
              const scrollBy = size
              swp.scrollBy(scrollBy, false);
            }
          }}
          style={{}} loop={false} showsButtons={false} showsPagination={false}  >
          {azkarList.map((i, index) => {
            return <View key={index} style={{ flex: 1 }} testID="azkar-item">
              <View style={{
                flex: 1, borderWidth: 1, borderColor: colors.BYellow, margin: 7, borderStyle: "dashed", padding: 10, borderRadius: 10
              }}>
                <Item z={i} pn={index + 1} />
              </View>
            </View>
          })}
        </Swiper>
      </View>
    </View>
  );
}
