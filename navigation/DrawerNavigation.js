import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect, useState } from "react";
import { I18nManager, Share } from "react-native";
import Clrs from "../constants/Colors";
import Screen3 from '../screens/Screen3'
import MainScreen from '../screens/MainScreen';
import Fav from '../screens/Fav';
import SettingsScreen from '../screens/SettingsScreen';
import { t, setLanguage } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();
export function DNav() {
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
        drawerPosition: I18nManager.isRTL ? "right" : "left",
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
            style={{ width: "100%", height: "100%", backgroundColor: Clrs.BGreen }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
              <Image
                source={require("../assets/images/logo.png")}
                style={{ width: 128, height: 128 }}
              />
            </View>
            <Text style={{ textAlign: 'center', fontFamily: "Cairo_400Regular", fontWeight: "500", color: Clrs.BYellow, fontSize: 18 }}>{t("app.name")}</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Screen3")
              }}
              style={{
                // width: "100%",
                height: 64,
                marginLeft: 5,
                marginRight: 5,
                marginTop: 30,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('app.tasbih')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="target" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Fav")
              }}
              style={{
                // width: "100%",
                height: 64,
                marginLeft: 5,
                marginRight: 5,
                marginTop: 5,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.favorites')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="heart" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Home")
              }}
              style={{
                // width: "100%",
                height: 64,
                marginLeft: 5,
                marginRight: 5,
                marginTop: 5,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.allAzkar')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="list" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
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
                marginLeft: 5,
                marginRight: 5,
                marginTop: 5,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.shareApp')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="share-2" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const currentLang = await AsyncStorage.getItem('@language') || 'ar';
                const newLang = currentLang === 'ar' ? 'en' : 'ar';
                await setLanguage(newLang);
              }}
              style={{
                height: 64,
                marginLeft: 5,
                marginRight: 5,
                marginTop: 5,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('language.switch')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="globe" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Settings")
              }}
              style={{
                height: 64,
                marginLeft: 5,
                marginRight: 5,
                marginTop: 5,
                backgroundColor: Clrs.DGreen,
                flexDirection: "row",
              }}>
              <Image
                source={I18nManager.isRTL ? require("../assets/images/muslim.png") : require("../assets/images/muslim.en.png")}
                style={{
                  width: 64, height: 64
                }}
              />
              <Text style={{
                color: Clrs.BYellow,
                fontSize: 22,
                marginTop: 7,
                fontFamily: "Cairo_400Regular",
              }}>{t('navigation.settings')}</Text>
              <View style={{ flex: 1 }} />
              <Feather name="settings" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20, marginRight: 20 }} />
            </TouchableOpacity>
          </View>)
      }}
    >
      <Drawer.Screen name="Screen3" component={Screen3} />
      <Drawer.Screen name="Home" component={MainScreen} />
      <Drawer.Screen name="Fav" component={Fav} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator >
  );
}
