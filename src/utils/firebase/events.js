import { logEvent, getAnalytics } from '@react-native-firebase/analytics';
import { nativeApplicationVersion } from 'expo-application';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isCategoryEnabled } from './telemetry';

export default async function LogEvent(title, params = {}) {
    if (!isCategoryEnabled(title === 'screen_view' ? 'screens' : 'events')) return;
    let eventParams = { ...params };
    if (isCategoryEnabled('device')) {
        const os_type = Platform?.OS
        const version = nativeApplicationVersion || Constants?.expoConfig?.version
        eventParams = {
            version,
            notes: `${version} - ${os_type}`,
            platform: os_type,
            ...params
        }
    }
    try {
        const analytics = getAnalytics();
        await logEvent(analytics, title, eventParams);
        console.log(`Logged event: ${title}`, eventParams);
    } catch (error) {
        console.error(`Error logging event: ${title}`, error);
    }
}
