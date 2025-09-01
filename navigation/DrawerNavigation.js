import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect, useState } from "react";
import { I18nManager, Share } from "react-native";
import { useColors } from "../constants/Colors";
import Screen3 from '../screens/Screen3'
import MainScreen from '../screens/MainScreen';
import Fav from '../screens/Fav';
import SettingsScreen from '../screens/SettingsScreen';
import ContributeScreen from '../screens/ContributeScreen';
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
      initialRouteName="Fav"
      screenOptions={{
        drawerPosition: isRTL() ? "right" : "left",
        drawerType: "slide",
        headerShown: false,
      }}
      drawerContent={({ navigation }) => {
        // Handle initial screen navigation
        useEffect(() => {
          if (initialScreen && initialScreen !== 'Fav') {
            const routeMap = {
              'All': 'Home',
              'Fav': 'Fav',
              'Tasbih': 'Screen3',
              'Settings': 'Settings',
            };
            const routeName = routeMap[initialScreen] || 'Fav';
            const timer = setTimeout(() => {
              setInitialScreen(null);
              navigation.navigate(routeName);
            }, 100);
            return () => clearTimeout(timer);
          }
        }, [initialScreen, navigation]);

        return (
          <View
            testID="drawer-container"
            style={{ width: "100%", height: "100%", backgroundColor: colors.BGreen }}>
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
                textAlign: getRTLTextAlign('left'),
              }}>{t('app.tasbih')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="target" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="fav-screen"
              onPress={() => {
                navigation.navigate("Fav")
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
                textAlign: getRTLTextAlign('left'),
              }}>{t('navigation.favorites')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="heart" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="main-screen"
              onPress={() => {
                navigation.navigate("Home")
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
                textAlign: getRTLTextAlign('left'),
              }}>{t('navigation.allAzkar')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="list" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.shareApp')}</Text>
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.contribute')}</Text>
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
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('language.switch')}</Text>
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
                backgroundColor: colors.DGreen,
                flexDirection: "row",
              }}>
              {isRTL() ? (
                <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              ) : (
                <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={64} height={64} />
              )}
              <Text style={{
                color: colors.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.settings')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="settings" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
            </TouchableOpacity>
          </View>)
      }}
    >
      <Drawer.Screen name="Screen3" component={Screen3} />
      <Drawer.Screen name="Home" component={MainScreen} />
      <Drawer.Screen name="Fav" component={Fav} />
      <Drawer.Screen name="Contribute" component={ContributeScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator >
  );
}
