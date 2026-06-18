import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect, useState } from "react";
import { I18nManager, Share, ScrollView, Platform } from "react-native";
import { useColors } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import Screen3 from '../screens/Screen3'
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContributeScreen from '../screens/ContributeScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranScreen from '../screens/QuranScreen';
import BooksScreen from '../screens/BooksScreen';
import RadioScreen from '../screens/RadioScreen';
import IslamicCalendarScreen from '../screens/IslamicCalendarScreen';
import WirdPlannerScreen from '../screens/WirdPlannerScreen';
import HifzTrackerScreen from '../screens/HifzTrackerScreen';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign, setLanguage } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
import { LogoSvg } from '../components/LogoSvg';
import { PRAYER_CONSTANTS } from "../constants/PrayerConstants";

const Drawer = createDrawerNavigator();

function useInitialDrawerRoute() {
  const [resolved, setResolved] = useState(undefined);
  useEffect(() => {
    AsyncStorage.getItem('@firstTimeSettings').then(ft => {
      if (ft === null) {
        setResolved({ route: 'Settings' });
        return;
      }
      AsyncStorage.getItem('@initialScreen').then(screen => {
        const map = {
          All: { route: 'Home', params: { showFavorites: false } },
          Fav: { route: 'Home', params: { showFavorites: true } },
          Tasbih: { route: 'Screen3' },
          PrayerTimes: { route: 'PrayerTimes' },
          Qibla: { route: 'Qibla' },
          Quran: { route: 'Quran' },
          Books: { route: 'Books' },
          Radio: { route: 'Radio' },
          IslamicCalendar: { route: 'IslamicCalendar' },
          WirdPlanner: { route: 'WirdPlanner' },
          HifzTracker: { route: 'HifzTracker' },
        };
        setResolved(map[screen] || map.Fav);
      });
    });
  }, []);
  return resolved;
}

export function DNav() {
  const colors = useColors();
  const [hasLocation, setHasLocation] = useState(false);
  const initial = useInitialDrawerRoute();

  useEffect(() => {
    AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION).then(loc => {
      setHasLocation(!!loc);
    });
  }, []);

  if (initial === undefined) {
    return null;
  }

  const homeInitialParams = initial.route === 'Home' ? initial.params : undefined;

  return (
    <Drawer.Navigator
      initialRouteName={initial.route}
      screenOptions={{
        drawerPosition: isRTL() ? "right" : "left",
        drawerType: "slide",
        headerShown: false,
      }}
      drawerContent={({ navigation }) => {
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
                testID="quran-screen"
                onPress={() => {
                  navigation.navigate("Quran")
                }}
                style={{
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
                ]}>{t('navigation.quran')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="book-open" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="books-screen"
                onPress={() => {
                  navigation.navigate("Books")
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
                ]}>{t('navigation.books')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="book" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="radio-screen"
                onPress={() => {
                  navigation.navigate("Radio")
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
                ]}>{t('navigation.radio')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="radio" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="screen3"
                onPress={() => {
                  navigation.navigate("Screen3")
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
                ]}>{t('app.tasbih')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="target" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="main-screen"
                onPress={() => {
                  navigation.navigate("Home", { showFavorites: false })
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
                ]}>{t('navigation.azkar')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="list" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="prayer-times-screen"
                onPress={() => {
                  if (!hasLocation) {
                    // If location is not set, navigate to UnifiedPrayerSettings to set it
                    navigation.toggleDrawer()
                    navigation.navigate("UnifiedPrayerSettings");
                    return;
                  }
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
                  if (!hasLocation) {
                    // If location is not set, navigate to UnifiedPrayerSettings to set it
                    navigation.toggleDrawer()
                    navigation.navigate("UnifiedPrayerSettings");
                    return;
                  }
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
                testID="islamic-calendar-screen-link"
                onPress={() => navigation.navigate("IslamicCalendar")}
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
                ]}>{t('navigation.islamicCalendar')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="calendar" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="wird-planner-screen-link"
                onPress={() => navigation.navigate("WirdPlanner")}
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
                ]}>{t('navigation.wirdPlanner')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="book-open" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="hifz-tracker-screen-link"
                onPress={() => navigation.navigate("HifzTracker")}
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
                ]}>{t('navigation.hifzTracker')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="bookmark" size={24} color={colors.BYellow} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
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
                  navigation.toggleDrawer()
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
                  marginBottom: 40,
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
      <Drawer.Screen name="Home" component={MainScreen} initialParams={homeInitialParams} />
      <Drawer.Screen name="Quran" component={QuranScreen} />
      <Drawer.Screen name="Books" component={BooksScreen} />
      <Drawer.Screen name="Radio" component={RadioScreen} />
      <Drawer.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Drawer.Screen name="Qibla" component={QiblaScreen} />
      <Drawer.Screen name="IslamicCalendar" component={IslamicCalendarScreen} />
      <Drawer.Screen name="WirdPlanner" component={WirdPlannerScreen} />
      <Drawer.Screen name="HifzTracker" component={HifzTrackerScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator >
  );
}
