import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mystore } from '../redux/store';
import loadFirebaseAnalytics from './firebase/load';
import PrayerCountdownService from './PrayerCountdownService';
import { syncWidgetData } from './PrayerWidgetService';
import NotificationService from './NotificationService';
import PrayerNotificationScheduler from './PrayerNotificationScheduler';
import QcfDownloader from './QcfDownloader';
import { loadTasbih } from './TasbihStore';
import RadioService from './RadioService';
import MediaSessionController from './MediaSessionController';


export async function loadResourcesAndDataAsync() {
    // Language must be set before any service that reads t() or moment.locale,
    // otherwise notifications can be built with default-language text while the
    // user has chosen the other language.
    await initializeLanguage();

    try {
        SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
            ...Ionicons.font,
            'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
            'Hafs': require('../assets/fonts/Hafs.otf'),
            'UthmanicHafs': require('../assets/quran/fonts/UthmanicHafs1Ver18.ttf'),
            'KFGQPC_SurahNames': require('../assets/quran/fonts/sura_names.ttf'),
            'KFGQPC_Bismillah': require('../assets/quran/fonts/bismillah.ttf'),
        });
        await loadFirebaseAnalytics();

        // Initialize notification service (sets handler, listeners, Android channels).
        // Sounds is lazily initialized on first playback via Sounds.playNotificationSound.
        try {
            await NotificationService.initialize();
        } catch (error) {
            console.error('Failed to initialize NotificationService:', error);
        }

        // Initialize prayer countdown service
        try {
            await PrayerCountdownService.initialize();
            console.log('Prayer countdown service initialized');
        } catch (error) {
            console.error('Failed to initialize prayer countdown service:', error);
        }

        // Push fresh prayer data to the home screen widget on every launch,
        // independent of whether the persistent countdown notification is enabled.
        syncWidgetData();

        try {
            await loadTasbih();
        } catch (error) {
            console.error('Failed to load tasbih counters:', error);
        }

        if (Platform.OS !== 'web') {
            try {
                await RadioService.initialize();
            } catch (error) {
                console.error('Failed to initialize radio service:', error);
            }
        }

        try {
            MediaSessionController.initialize();
        } catch (error) {
            console.error('Failed to initialize media session controller:', error);
        }

    } catch (e) {
        console.warn(e);
    } finally {
        const zikrData = await AsyncStorage.getItem("@zikr");
        global.zikr = zikrData;

        QcfDownloader.checkInstalled()
            .then(() => QcfDownloader.autoInstall('v2'))
            .catch((error) => {
                console.warn('QCF downloader check failed:', error);
            });
        mystore.dispatch({
            type: 'change',
            obj: {
                "Azkar": zikrData != undefined ? JSON.parse(zikrData) : Azkar
            }
        });

        // Schedule prayer notifications after language is initialized
        // so notification bodies are translated into the user's language
        try {
            await PrayerNotificationScheduler.initialize();
        } catch (error) {
            console.error('Failed to initialize prayer notification scheduler:', error);
        }

        // Don't hide splash screen here - let App.js handle it after theme loads
        return true;
    }
}