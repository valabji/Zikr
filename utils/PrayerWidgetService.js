import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { calculatePrayerTimes } from './PrayerUtils';

export const WIDGET_APP_GROUP = 'group.com.valabji.zikr.widget';
export const WIDGET_DATA_KEY = 'prayerWidgetData';
export const ANDROID_WIDGET_NAME = 'PrayerTimes';

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Today's 5 prayers plus tomorrow's fajr, sorted ascending, so a stale reader
// (native widget code that can't run the adhan JS library) always has a "next" entry.
export const buildWidgetSchedule = (location, calculationMethod, madhab) => {
  const today = calculatePrayerTimes(location.latitude, location.longitude, location.timezone, new Date(), calculationMethod, madhab);
  if (!today) return null;

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = calculatePrayerTimes(location.latitude, location.longitude, location.timezone, tomorrowDate, calculationMethod, madhab);

  const prayers = PRAYER_ORDER.map((name) => ({ name, time: today[name].toISOString() }));
  if (tomorrow && tomorrow.fajr) {
    prayers.push({ name: 'fajr', time: tomorrow.fajr.toISOString() });
  }

  return {
    city: location.city || location.name || '',
    prayers,
    updatedAt: new Date().toISOString(),
  };
};

export const getWidgetPrayerData = async () => {
  const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
  if (!savedLocation) return null;
  const location = JSON.parse(savedLocation);

  const calculationMethod = (await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD)) || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD;
  const madhab = (await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB)) || PRAYER_CONSTANTS.DEFAULT_MADHAB;

  return buildWidgetSchedule(location, calculationMethod, madhab);
};

const syncIOSWidget = async (data) => {
  const SharedGroupPreferences = require('react-native-shared-group-preferences').default;
  await SharedGroupPreferences.setItem(WIDGET_DATA_KEY, data, WIDGET_APP_GROUP);
};

const syncAndroidWidget = async (data) => {
  const { requestWidgetUpdate } = require('react-native-android-widget');
  const { renderPrayerWidget } = require('../widgets/PrayerWidget');
  await requestWidgetUpdate({
    widgetName: ANDROID_WIDGET_NAME,
    renderWidget: () => renderPrayerWidget(data),
  });
};

// Pushes the freshest prayer schedule to wherever the home screen widget reads from.
// Android re-renders the JSX widget directly; iOS can't run JS, so it gets a JSON
// snapshot written to App Group shared storage for the WidgetKit extension to read.
export const syncWidgetData = async () => {
  try {
    const data = await getWidgetPrayerData();
    if (!data) return;

    if (Platform.OS === 'ios') {
      await syncIOSWidget(data);
    } else if (Platform.OS === 'android') {
      await syncAndroidWidget(data);
    }
  } catch (error) {
    console.error('Error syncing widget data:', error);
  }
};
