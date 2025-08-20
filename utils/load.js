import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

import { mystore } from '../redux/store';

export async function loadResourcesAndDataAsync() {
    try {
        SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
            ...Ionicons.font,
            'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
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
        await SplashScreen.hideAsync();
        try{
        analytics().logAppOpen();
        analytics().logEvent('App_Loaded_Successfully', {
            version: Constants.manifest.version,
            platform: Platform.OS,
        });
        } catch (error) {
            console.error("Error logging app open event:", error);
        }
        return true;
    }
}