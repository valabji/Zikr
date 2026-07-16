import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '@/locales/i18n';
import { APP_KEYS } from '@/constants/StorageKeys';

export function getItemAction(id, navigation, hasLocation) {
  switch (id) {
    case 'quran': return () => navigation.navigate('Quran');
    case 'books': return () => navigation.navigate('Books');
    case 'radio': return () => navigation.navigate('Radio');
    case 'tasbih': return () => navigation.navigate('Screen3');
    case 'azkar': return () => navigation.navigate('Home', { showFavorites: false });
    case 'prayerTimes': return () => {
      if (!hasLocation) { navigation.toggleDrawer?.(); navigation.navigate('UnifiedPrayerSettings'); return; }
      navigation.navigate('PrayerTimes');
    };
    case 'qibla': return () => {
      if (!hasLocation) { navigation.toggleDrawer?.(); navigation.navigate('UnifiedPrayerSettings'); return; }
      navigation.navigate('Qibla');
    };
    case 'islamicCalendar': return () => navigation.navigate('IslamicCalendar');
    case 'wirdPlanner': return () => navigation.navigate('WirdPlanner');
    case 'hifzTracker': return () => navigation.navigate('HifzTracker');
    case 'about': return () => { navigation.toggleDrawer?.(); navigation.navigate('About'); };
    case 'language': return async () => {
      const currentLang = await AsyncStorage.getItem(APP_KEYS.LANGUAGE) || 'ar';
      await setLanguage(currentLang === 'ar' ? 'en' : 'ar');
    };
    default: return () => {};
  }
}
