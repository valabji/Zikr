import { nativeApplicationVersion } from 'expo-application';
import { Platform } from 'react-native';

export default async function LogEvent(title, params = {}) {
    const os_type = Platform?.OS
    const version = os_type === 'web' ? 'web' : nativeApplicationVersion
}