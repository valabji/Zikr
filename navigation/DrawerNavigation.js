import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect, useState } from "react";
import { I18nManager, Share, ScrollView } from "react-native";
import { useColors } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import Screen3 from '../screens/Screen3'
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContributeScreen from '../screens/ContributeScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QiblaScreen from '../screens/QiblaScreen';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign, setLanguage } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
import { LogoSvg } from '../components/LogoSvg';

const Drawer = createDrawerNavigator();
export function DNav() {
  const colors = useColors();
  const [initialScreen, setInitialScreen] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@initialScreen').then(screen => {
      AsyncStorage.getItem('@firstTimeSettings').then(ft => {
        if (ft === null) {
          setInitialScreen('Settings');
        } else {
          setInitialScreen(screen);
        }
    })});
  }, []);

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        drawerPosition: isRTL() ? "right" : "left",
        drawerType: "slide",
        headerShown: false,
      }}
      drawerContent={({ navigation }) => {
        // Handle initial screen navigation
        useEffect(() => {
          if (initialScreen) {
            const routeMap = {
              'All': 'Home',
              'Fav': 'Home',
              'Tasbih': 'Screen3',
              'Settings': 'Settings',
            };
            const routeName = routeMap[initialScreen] || 'Home';
            const routeParams = initialScreen === 'Fav' ? { showFavorites: true } : { showFavorites: false };
            
            const timer = setTimeout(() => {
              setInitialScreen(null);
              navigation.navigate(routeName, routeParams);
            }, 100);
            return () => clearTimeout(timer);
          }
        }, [initialScreen, navigation]);

        return (
          <View
            testID="drawer-container"
            style={{ width: "100%", height: "100%", backgroundColor: colors.BGreen }}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
                <LogoSvg
                  color={colors.BYellow}
                  spacing={80}
                  width={128}
                  height={148}
                />
              </View>
            <TouchableOpacity
              testID="screen3"
              onPress={() => {
                navigation.navigate("Screen3")
              }}
              style={{
                // width: "100%",
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 30,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                  textAlign: getRTLTextAlign('left'),
                }
              ]}>{t('app.tasbih')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="target" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="fav-screen"
              onPress={() => {
                navigation.navigate("Home", { showFavorites: true })
              }}
              style={{
                // width: "100%",
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                  textAlign: getRTLTextAlign('left'),
                }
              ]}>{t('navigation.favorites')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="heart" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="main-screen"
              onPress={() => {
                navigation.navigate("Home", { showFavorites: false })
              }}
              style={{
                // width: "100%",
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                  textAlign: getRTLTextAlign('left'),
                }
              ]}>{t('navigation.allAzkar')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="list" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="prayer-times-screen"
              onPress={() => {
                navigation.navigate("PrayerTimes")
              }}
              style={{
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                  textAlign: getRTLTextAlign('left'),
                }
              ]}>{t('navigation.prayerTimes')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="clock" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="qibla-screen"
              onPress={() => {
                navigation.navigate("Qibla")
              }}
              style={{
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                  textAlign: getRTLTextAlign('left'),
                }
              ]}>{t('navigation.qibla')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="compass" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Share.share({
                  message: t('share.message'),
                });
              }}
              style={{
                // width: "100%",
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                }
              ]}>{t('navigation.shareApp')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="share-2" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="contribute-screen"
              onPress={() => {
                navigation.navigate("Contribute")
              }}
              style={{
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                }
              ]}>{t('navigation.contribute')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="help-circle" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const currentLang = await AsyncStorage.getItem('@language') || 'ar';
                const newLang = currentLang === 'ar' ? 'en' : 'ar';
                await setLanguage(newLang);
              }}
              style={{
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                }
              ]}>{t('language.switch')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="globe" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="settings-screen"
              onPress={() => {
                navigation.navigate("Settings")
              }}
              style={{
                height: 64,
                ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                marginTop: 5,
                marginBottom:40,
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={[
                textStyles.navigation,
                {
                  color: colors.BYellow,
                  marginTop: 7,
                }
              ]}>{t('navigation.settings')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="settings" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            </ScrollView>
          </View>)
      }}
    >
      <Drawer.Screen name="Screen3" component={Screen3} />
      <Drawer.Screen name="Home" component={MainScreen} />
      <Drawer.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Drawer.Screen name="Qibla" component={QiblaScreen} />
    </Drawer.Navigator >
  );
}
