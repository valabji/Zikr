import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TouchableHighlight, StyleSheet, I18nManager } from 'react-native'
import { StackActions } from '@react-navigation/native';
import Clrs from "../constants/Colors";
import { t } from '../locales/i18n';
import Azkar from '../constants/Azkar.js';
import Swiper from 'react-native-swiper'
import { useAudio } from '../utils/Sounds.js';

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
  const name = route?.params?.name || "Azkar";
  const [ft, setFt] = React.useState(true);
  const player = useAudio();
  const reverse = true //I18nManager.isRTL;

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
              swp.scrollBy(scrollBy, false);
            }
          }
        }}
        style={{ height: "100%" }}>
        <Text style={{
          color: Clrs.BYellow,
          fontSize: 14,
          marginTop: 6,
          fontFamily: "Cairo_400Regular",
          textAlign: I18nManager.isRTL ? "right" : "left",
          writingDirection: I18nManager.isRTL ? "rtl" : "ltr"
        }}>{z.zekr}</Text>
        <View style={{ borderTopWidth: 1, marginTop: 20, height: 1, width: "100%", borderStyle: "solid" }} />
        {z.reference != "" &&
          <Text style={{
            color: Clrs.BYellow,
            fontSize: 14,
            marginTop: 26,
            fontFamily: "Cairo_400Regular",
          }}>{t('zikr.reference', { text: z.reference })}</Text>}
        <Text style={{
          color: Clrs.BYellow,
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
                color: Clrs.BYellow,
                fontSize: 18,
              }}
            >{t('counter.page', { current: (reverse ? size - pn + 1 : pn), total: size })}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <ImageBackground
            source={require("../assets/images/Star.png")}
            style={{ width: 96, height: 96, alignSelf: "center", justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                color: Clrs.BYellow,
                fontSize: 18,
              }}
            >{i} / {z.count}</Text>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    </ScrollView>
  }

  const azkarList = Azkar.filter(i => i.category == name);
  size = azkarList.length;
  if (reverse) {
    azkarList.reverse();
  }

  return (
    <View style={{ flex: 1, flexGrow: 1 }}>
      <CustomHeader title={name} isHome={false} navigation={navigation} />
      <ImageBackground
        source={require("../assets/images/bg.jpg")}
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: Clrs.BGreen }}
      >
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
        <Swiper ref={(ref) => { swp = ref; }}
          onContentSizeChange={() => {
            if (reverse && ft) {
              setFt(false);
              const scrollBy = size
              swp.scrollBy(scrollBy, false);
            }
          }}
          style={{}} loop={false} showsButtons={false} showsPagination={false}  >
          {azkarList.map((i, index) => {
            return <View key={index} style={{ flex: 1 }}>
              <View style={{
                flex: 1, borderWidth: 1, borderColor: Clrs.BYellow, margin: 7, borderStyle: "dashed", padding: 10, borderRadius: 10
              }}>
                <Item z={i} pn={index + 1} />
              </View>
            </View>
          })}
        </Swiper>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  slide1: {
    flex: 1,
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  }
})
