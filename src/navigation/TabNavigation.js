import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import HomeGridScreen from '@/screens/HomeGridScreen';
import Screen3 from '@/screens/Screen3';
import MainScreen from '@/screens/MainScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import PrayerTimesScreen from '@/screens/PrayerTimesScreen';
import QiblaScreen from '@/screens/QiblaScreen';
import QuranScreen from '@/screens/QuranScreen';
import BooksScreen from '@/screens/BooksScreen';
import RadioScreen from '@/screens/RadioScreen';
import IslamicCalendarScreen from '@/screens/IslamicCalendarScreen';
import WirdPlannerScreen from '@/screens/WirdPlannerScreen';
import HifzTrackerScreen from '@/screens/HifzTrackerScreen';
import { DEFAULT_MENU_CONFIG, ITEM_DEFS, ITEM_ROUTES, splitMenuForTabs } from '@/constants/MenuConfig';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { APP_KEYS } from '@/constants/StorageKeys';

const Tab = createBottomTabNavigator();

const SCREENS = {
  HomeGrid: { component: HomeGridScreen },
  Home: { component: MainScreen, initialParams: { showFavorites: false } },
  Screen3: { component: Screen3 },
  Quran: { component: QuranScreen },
  Books: { component: BooksScreen },
  Radio: { component: RadioScreen },
  PrayerTimes: { component: PrayerTimesScreen, gated: true },
  Qibla: { component: QiblaScreen, gated: true },
  IslamicCalendar: { component: IslamicCalendarScreen },
  WirdPlanner: { component: WirdPlannerScreen },
  HifzTracker: { component: HifzTrackerScreen },
  Settings: { component: SettingsScreen },
};

export function TNav() {
  const colors = useColors();
  const [firstTime, setFirstTime] = useState(undefined);
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [hasLocation, setHasLocation] = useState(false);

  const loadMenuConfig = useCallback(async () => {
    const stored = await AsyncStorage.getItem(APP_KEYS.MENU_CONFIG);
    let parsed = null;
    try { parsed = stored ? JSON.parse(stored) : null; } catch {}
    setMenuConfig(Array.isArray(parsed) ? parsed : DEFAULT_MENU_CONFIG);
    const loc = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    setHasLocation(!!loc);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(APP_KEYS.FIRST_TIME_SETTINGS).then(ft => setFirstTime(ft === null));
    loadMenuConfig();
  }, []);

  if (firstTime === undefined) {
    return null;
  }

  const { tabItems } = splitMenuForTabs(menuConfig);
  const icons = { HomeGrid: 'grid', Settings: 'settings' };
  const labels = { HomeGrid: t('navigation.main'), Settings: t('navigation.settings') };
  tabItems.forEach(i => {
    icons[ITEM_ROUTES[i.id]] = ITEM_DEFS[i.id].icon;
    labels[ITEM_ROUTES[i.id]] = t(ITEM_DEFS[i.id].labelKey);
  });
  const shownRoutes = new Set(['HomeGrid', ...tabItems.map(i => ITEM_ROUTES[i.id]), 'Settings']);
  const routeOrder = [...shownRoutes, ...Object.keys(SCREENS).filter(n => !shownRoutes.has(n))];

  const locationGate = ({ navigation }) => ({
    tabPress: (e) => {
      if (!hasLocation) {
        e.preventDefault();
        navigation.navigate('UnifiedPrayerSettings');
      }
    },
  });

  return (
    <Tab.Navigator
      initialRouteName={firstTime ? 'Settings' : 'HomeGrid'}
      screenListeners={{ focus: loadMenuConfig }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.BYellow,
        tabBarInactiveTintColor: colors.BYellow + '77',
        tabBarStyle: { backgroundColor: colors.DGreen, borderTopColor: colors.DGreen },
        tabBarItemStyle: shownRoutes.has(route.name) ? undefined : { display: 'none' },
        tabBarIcon: ({ color, size }) => <Feather name={icons[route.name] || 'circle'} size={size} color={color} />,
        tabBarLabel: labels[route.name] || route.name,
      })}
    >
      {routeOrder.map(name => (
        <Tab.Screen
          key={name}
          name={name}
          component={SCREENS[name].component}
          initialParams={SCREENS[name].initialParams}
          listeners={SCREENS[name].gated ? locationGate : undefined}
        />
      ))}
    </Tab.Navigator>
  );
}
