import analytics from '@react-native-firebase/analytics';
import { nativeApplicationVersion } from 'expo-application';
import { Platform } from 'react-native';

export default async function LogEvent(title, params = {}) {
    const os_type = Platform?.OS
    const version = os_type === 'web' ? 'web' : nativeApplicationVersion
    analytics().logEvent(title, {
        version,
        notes: `${version} - ${os_type}`,
        platform: os_type,
        ...params
    })
}