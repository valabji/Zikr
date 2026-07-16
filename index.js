import registerRootComponent from 'expo/src/launch/registerRootComponent';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './src/App';
import { widgetTaskHandler } from './src/widgets/PrayerWidgetTaskHandler';

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
