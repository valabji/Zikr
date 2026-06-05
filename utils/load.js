import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mystore } from '../redux/store';
import loadFirebaseAnalytics from './firebase/load';
import PrayerCountdownService from './PrayerCountdownService';
import NotificationService from './NotificationService';
import PrayerNotificationScheduler from './PrayerNotificationScheduler';


export async function loadResourcesAndDataAsync() {
    try {
        SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
            ...Ionicons.font,
            'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
            'Hafs': require('../assets/fonts/Hafs.otf'),
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
    } catch (e) {
        console.warn(e);
    } finally {
        await initializeLanguage(); // Initialize translations first
        const zikrData = await AsyncStorage.getItem("@zikr");
        global.zikr = zikrData;
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