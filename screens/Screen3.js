import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, ScrollView, TouchableOpacity, I18nManager, Alert, BackHandler, Image, ImageBackground, Modal, TouchableHighlight } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, useIsBrightTheme } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing } from '../locales/i18n';
import { Feather } from '@expo/vector-icons';
import { useAudio } from '../utils/Sounds';
import { BackgroundSvg2 } from '../components/BackgroundSvg2';
import { StarSvgFilled } from '../components/StarSvg';
import vibrationManager from '../utils/Vibration';
// import {
//   AdMobBanner,
//   AdMobInterstitial,
//   PublisherBanner,
//   AdMobRewarded,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

// const Banner = "ca-app-pub-1740754568229700/6853520443"
// const Interstatel = "ca-app-pub-1740754568229700/7975030420"

const audioSource = require('../assets/sound/kikhires.mp3');

export default function Screen2({ route, navigation }) {
  const colors = useColors();
  const [i, setI] = React.useState(0)
  const [mv, setMv] = React.useState(false)
  const player = useAudio();

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <BackgroundSvg2 color={colors.BYellow} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={mv}
        onRequestClose={() => {
          setMv(false)
        }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={{
            backgroundColor: colors.white,
            shadowColor: colors.shadowColor,
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.20,
            shadowRadius: 1.41,
            justifyContent: "center",
            alignItems: "center",
            elevation: 2,
            width: 240,
            height: 220,
            borderRadius: 20,
          }}>
            <Feather name="info" size={64} color={colors.DYellow} />
            <Text style={[
              textStyles.subtitle,
              {
                color: colors.DGreen,
                textAlign: "center",
                marginTop: 10,
                ...getDirectionalMixedSpacing({ marginRight: 15, marginLeft: 15 }),
              }
            ]}
            >{t('counter.resetConfirmation')}</Text>

            <View style={{ flexDirection: "row-reverse", width: "100%", marginTop: 20, justifyContent: "space-around" }}>
              <TouchableHighlight
                onPress={() => {
                  setI(0)
                  setMv(false)
                }}
                style={{ backgroundColor: colors.DYellow, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={[
                  textStyles.subtitle,
                  {
                    color: colors.DGreen,
                    lineHeight: 28,
                  }
                ]}>{t('counter.yes')}</Text>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={() => {
                  setMv(false)
                }}
                style={{ backgroundColor: colors.BGreen, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={[
                  textStyles.subtitle,
                  {
                    color: colors.BYellow,
                    lineHeight: 28,
                  }
                ]}>{t('counter.no')}</Text>
              </TouchableHighlight>

            </View>
          </View>
        </View>
      </Modal>

      <CustomHeader title={t('app.tasbih')} isHome={true} navigation={navigation} Left={() => {
        return <TouchableOpacity
          onPress={() => {
            setMv(true)
          }}
          style={{ flex: 1, justifyContent: "center", alignItems: "flex-end",paddingHorizontal:20 }}>
          <Feather name="rotate-cw" color={colors.BYellow} size={32} />
        </TouchableOpacity>
      }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
        <TouchableOpacity
          onPressIn={() => {
            setI(i + 1)
            player.playClick();
            vibrationManager.vibrateForTasbih();
          }}
          style={{ flex: 1, justifyContent: "center", width: "100%", alignItems: "center" }}
        >
          <View style={{ width: 256, height: 256, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
            <StarSvgFilled width={256} height={256} />
            <Text
              style={[
                textStyles.base,
                {
                  position: 'absolute',
                  color: colors.primary,
                  fontSize: 32,
                  fontWeight: 'bold',
                }
              ]}
            >{i}</Text>
          </View>
        </TouchableOpacity>
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
      </View>

    </View>
  );
}
