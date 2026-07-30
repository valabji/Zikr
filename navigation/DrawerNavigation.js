import { createDrawerNavigator } from "@react-navigation/drawer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { useColors, getItemColors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '../constants/Fonts';
import Screen3 from '../screens/Screen3'
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranScreen from '../screens/QuranScreen';
import BooksScreen from '../screens/BooksScreen';
import RadioScreen from '../screens/RadioScreen';
import IslamicCalendarScreen from '../screens/IslamicCalendarScreen';
import WirdPlannerScreen from '../screens/WirdPlannerScreen';
import HifzTrackerScreen from '../screens/HifzTrackerScreen';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
import { LogoSvg } from '../components/LogoSvg';
import { PRAYER_CONSTANTS } from "../constants/PrayerConstants";
import { formatHijriDate } from '../utils/HijriCalendar';
import { DEFAULT_MENU_CONFIG, ITEM_DEFS } from '../constants/MenuConfig';
import { getItemAction } from '../utils/menuActions';

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
  const hijriDate = useMemo(() => formatHijriDate(), []);
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [showDate, setShowDate] = useState(true);

  const loadMenuConfig = useCallback(async () => {
    const stored = await AsyncStorage.getItem('@menuConfig');
    let parsed = null;
    try { parsed = stored ? JSON.parse(stored) : null; } catch {}
    setMenuConfig(Array.isArray(parsed) ? parsed : DEFAULT_MENU_CONFIG);
    const dateShown = await AsyncStorage.getItem('@menuShowDate');
    setShowDate(dateShown !== 'false');
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION).then(loc => {
      setHasLocation(!!loc);
    });
    loadMenuConfig();
  }, []);

  if (initial === undefined) {
    return null;
  }

  const homeInitialParams = initial.route === 'Home' ? initial.params : undefined;
  const visibleItems = menuConfig.filter(i => i.visible);

  return (
    <Drawer.Navigator
      initialRouteName={initial.route}
      screenOptions={{
        drawerPosition: isRTL() ? "right" : "left",
        drawerType: "slide",
        headerShown: false,
      }}
      screenListeners={{ focus: loadMenuConfig }}
      drawerContent={({ navigation }) => {
        const settingsG = getItemColors(colors, visibleItems.length);
        const settingsFg = settingsG ? settingsG.fg : colors.BYellow;
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
              {showDate && (
                <Text style={{ color: colors.BYellow, fontSize: 11, textAlign: 'center', opacity: 0.7, marginTop: 4 }}>
                  {hijriDate}
                </Text>
              )}
              {visibleItems.map((item, idx) => {
                const def = ITEM_DEFS[item.id];
                if (!def) return null;
                const action = getItemAction(item.id, navigation, hasLocation);
                const g = getItemColors(colors, idx);
                const fg = g ? g.fg : colors.BYellow;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={def.testID}
                    onPress={action}
                    style={{
                      height: 64,
                      ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                      marginTop: idx === 0 ? 30 : 5,
                      backgroundColor: g ? 'transparent' : colors.DGreen,
                      borderRadius: g ? 12 : 0,
                      overflow: 'hidden',
                      flexDirection: "row",
                    }}>
                    {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
                    {isRTL() ? (
                      <MuslimIconSvg color={fg} backgroundColor={g ? g.gradient[0] : colors.DGreen} width={64} height={64} />
                    ) : (
                      <MuslimIconEnSvg color={fg} backgroundColor={g ? g.gradient[0] : colors.DGreen} width={64} height={64} />
                    )}
                    <Text style={[
                      textStyles.navigation,
                      {
                        color: fg,
                        marginTop: 7,
                        textAlign: getRTLTextAlign('left'),
                      }
                    ]}>{t(def.labelKey)}</Text>
                    <View style={{ flex: 1 }} />
                    <Feather name={def.icon} size={24} color={fg} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                testID="settings-screen"
                onPress={() => {
                  navigation.navigate("Settings")
                }}
                style={{
                  height: 64,
                  ...getDirectionalMixedSpacing({ marginLeft: 5, marginRight: 5 }),
                  marginTop: visibleItems.length === 0 ? 30 : 5,
                  marginBottom: 40,
                  backgroundColor: settingsG ? 'transparent' : colors.DGreen,
                  borderRadius: settingsG ? 12 : 0,
                  overflow: 'hidden',
                  flexDirection: "row",
                }}>
                {settingsG && <LinearGradient colors={settingsG.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
                {isRTL() ? (
                  <MuslimIconSvg color={settingsFg} backgroundColor={settingsG ? settingsG.gradient[0] : colors.DGreen} width={64} height={64} />
                ) : (
                  <MuslimIconEnSvg color={settingsFg} backgroundColor={settingsG ? settingsG.gradient[0] : colors.DGreen} width={64} height={64} />
                )}
                <Text style={[
                  textStyles.navigation,
                  {
                    color: settingsFg,
                    marginTop: 7,
                  }
                ]}>{t('navigation.settings')}</Text>
                <View style={{ flex: 1 }} />
                <Feather name="settings" size={24} color={settingsFg} style={{ marginTop: 17, ...getDirectionalMixedSpacing({ marginLeft: 20, marginRight: 20 }) }} />
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
