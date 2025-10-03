import { logEvent, getAnalytics } from '@react-native-firebase/analytics';
import { nativeApplicationVersion } from 'expo-application';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export default async function LogEvent(title, params = {}) {
    const os_type = Platform?.OS
    let version = nativeApplicationVersion
    const expoVersion = Constants?.expoConfig?.version
    if (!version) {
        version = expoVersion
    }
    const analytics = getAnalytics();
    const eventParams =  {
        version,
        notes: `${version} - ${os_type}`,
        platform: os_type,
        ...params
    }
    logEvent(analytics, title, eventParams).then(() => {
        console.log(`Logged event: ${title}`, eventParams);
    }).catch((error) => {
        console.error(`Error logging event: ${title}`, error);
    });
}