import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import HomeGridScreen from '../screens/HomeGridScreen';
import Screen3 from '../screens/Screen3';
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
import { DEFAULT_MENU_CONFIG, ITEM_DEFS } from '../constants/MenuConfig';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

const Tab = createBottomTabNavigator();

const ITEM_ROUTES = {
  quran: 'Quran',
  books: 'Books',
  radio: 'Radio',
  tasbih: 'Screen3',
  azkar: 'Home',
  prayerTimes: 'PrayerTimes',
  qibla: 'Qibla',
  islamicCalendar: 'IslamicCalendar',
  wirdPlanner: 'WirdPlanner',
  hifzTracker: 'HifzTracker',
};

export function TNav() {
  const colors = useColors();
  const [firstTime, setFirstTime] = useState(undefined);
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [hasLocation, setHasLocation] = useState(false);

  const loadMenuConfig = useCallback(async () => {
    const stored = await AsyncStorage.getItem('@menuConfig');
    let parsed = null;
    try { parsed = stored ? JSON.parse(stored) : null; } catch {}
    setMenuConfig(Array.isArray(parsed) ? parsed : DEFAULT_MENU_CONFIG);
    const loc = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    setHasLocation(!!loc);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@firstTimeSettings').then(ft => setFirstTime(ft === null));
    loadMenuConfig();
  }, []);

  if (firstTime === undefined) {
    return null;
  }

  const tabItems = menuConfig.filter(i => i.visible && ITEM_ROUTES[i.id]).slice(0, 3);
  const icons = { HomeGrid: 'grid', Settings: 'settings' };
  const labels = { HomeGrid: t('navigation.main'), Settings: t('navigation.settings') };
  tabItems.forEach(i => {
    icons[ITEM_ROUTES[i.id]] = ITEM_DEFS[i.id].icon;
    labels[ITEM_ROUTES[i.id]] = t(ITEM_DEFS[i.id].labelKey);
  });
  const shownRoutes = new Set(['HomeGrid', 'Settings', ...tabItems.map(i => ITEM_ROUTES[i.id])]);

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
      <Tab.Screen name="HomeGrid" component={HomeGridScreen} />
      <Tab.Screen name="Home" component={MainScreen} initialParams={{ showFavorites: false }} />
      <Tab.Screen name="Screen3" component={Screen3} />
      <Tab.Screen name="Quran" component={QuranScreen} />
      <Tab.Screen name="Books" component={BooksScreen} />
      <Tab.Screen name="Radio" component={RadioScreen} />
      <Tab.Screen name="PrayerTimes" component={PrayerTimesScreen} listeners={locationGate} />
      <Tab.Screen name="Qibla" component={QiblaScreen} listeners={locationGate} />
      <Tab.Screen name="IslamicCalendar" component={IslamicCalendarScreen} />
      <Tab.Screen name="WirdPlanner" component={WirdPlannerScreen} />
      <Tab.Screen name="HifzTracker" component={HifzTrackerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
