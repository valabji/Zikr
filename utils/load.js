import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

import { mystore } from '../redux/store';
import {nativeApplicationVersion} from 'expo-application'
import { Platform } from 'react-native';


export async function loadResourcesAndDataAsync() {
    try {
        SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
            ...Ionicons.font,
            'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
        const firebaseConfig = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE_CONFIG);
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        logEvent(analytics, 'App_Loaded_Successfully', {
            version: nativeApplicationVersion,
            notes: 'working from env',
            platform: Platform?.OS,
        });
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
        // Don't hide splash screen here - let App.js handle it after theme loads
        return true;
    }
}