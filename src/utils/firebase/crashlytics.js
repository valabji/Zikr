import { Platform } from 'react-native';

let collectionEnabled = true;

function getCrashModule() {
    if (Platform.OS === 'web') return null;
    try {
        return require('@react-native-firebase/crashlytics');
    } catch (error) {
        return null;
    }
}

export function setCrashCollection(enabled) {
    collectionEnabled = enabled;
    const mod = getCrashModule();
    if (!mod) return;
    try {
        mod.setCrashlyticsCollectionEnabled(mod.getCrashlytics(), enabled);
    } catch (error) {
        console.warn('Failed to toggle crashlytics collection:', error);
    }
}

export function recordAppError(error, context) {
    if (!collectionEnabled) return;
    const mod = getCrashModule();
    if (!mod) return;
    try {
        if (context) mod.log(mod.getCrashlytics(), context);
        mod.recordError(mod.getCrashlytics(), error);
    } catch (recordFailure) {
        console.warn('Failed to record error to crashlytics:', recordFailure);
    }
}
