import * as Updates from 'expo-updates';
import { DevSettings, Platform } from 'react-native';

const Restart = () => {
    if (Platform.OS == "web") {
        window.location.reload()
    }
    else if (__DEV__) {
        DevSettings.reload();
    } else if (Updates.isEnabled) {
        Updates.reloadAsync().catch((e) => console.warn('Updates.reloadAsync failed:', e));
    }
    // When expo-updates is disabled (e.g. local release builds) there is no safe
    // programmatic relaunch; the persisted change applies on the next manual launch.
}
export { Restart }