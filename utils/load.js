import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        return true;
    }
}