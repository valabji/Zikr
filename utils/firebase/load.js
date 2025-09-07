
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '@react-native-firebase/app';
import LogEvent from './events';
import { Platform } from 'react-native';

export default async function loadFirebaseAnalytics() {
    if (Platform?.OS === 'web') {
        firebase.setReactNativeAsyncStorage(AsyncStorage);
        let firebaseConfig = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE_CONFIG)
        firebaseConfig.databaseURL = firebaseConfig.storageBucket
        firebase.initializeApp(firebaseConfig)
    }
    await LogEvent('App_Loaded_Successfully', {
        my_note: 'working from env',
    });
}