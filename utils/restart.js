import * as Updates from 'expo-updates';
import { DevSettings, Platform } from 'react-native';

const Restart = () => {
    if (Platform.OS == "web") {
        window.location.reload()
    }
    else {
        if (__DEV__) {
            DevSettings.reload();
        } else {
            Updates.reloadAsync()
        }
    }
}
export { Restart }