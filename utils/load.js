import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '../locales/i18n';

import Azkar from '../constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mystore } from '../redux/store';
import loadFirebaseAnalytics from './firebase/load';
import Sounds from './Sounds';


export async function loadResourcesAndDataAsync() {
    try {
        SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
            ...Ionicons.font,
            'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
            'Hafs': require('../assets/fonts/Hafs.otf'),
        });
        await loadFirebaseAnalytics();
        
        // Initialize audio system
        try {
            await Sounds.initialize();
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
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
        // Don't hide splash screen here - let App.js handle it after theme loads
        return true;
    }
}