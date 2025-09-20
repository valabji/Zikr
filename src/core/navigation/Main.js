
import { NavigationContainer } from '@react-navigation/native';
import linkingOptions from './useLinking';
import AzkarReaderScreen from '../../features/azkar/screens/AzkarReaderScreen';
import ContributeScreen from '../../screens/ContributeScreen';
import PrayerSettingsScreen from '../../features/settings/screens/PrayerSettingsScreen';
import { DNav } from './DrawerNavigation';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useColors, useIsBrightTheme } from '../../theme/Colors';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';
import AppSettingsScreen from '../../features/settings/screens/AppSettingsScreen';
import LogEvent from '../../common/utils/firebase/events';


export const AppContainer = () => {
    const colors = useColors();
    const isBrightTheme = useIsBrightTheme();
    const Stack = createStackNavigator();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: Platform.OS === 'ios' ? Constants.statusBarHeight : 0,
            backgroundColor: colors.DGreen,
        },
    });

    return <View style={styles.container}>
        <StatusBar barStyle={isBrightTheme ? "dark-content" : "light-content"} backgroundColor={colors.DGreen} />
        <NavigationContainer
            linking={linkingOptions}>
            <Stack.Navigator
                screenListeners={{
                    state: (e) => {
                        const currentState = e.data.state;
                        let actualRoute = currentState.routes[currentState.index];
                        while (actualRoute.state) {
                            actualRoute = actualRoute.state.routes[actualRoute.state.index];
                        }
                        LogEvent("screen_view", {
                            screen_name: actualRoute.name,
                            screen_class: actualRoute.name,
                        });
                    }
                }}
            >
                <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="AzkarReader" component={AzkarReaderScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                 <Stack.Screen name="Contribute" component={ContributeScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                 <Stack.Screen name="PrayerSettings" component={PrayerSettingsScreen} options={{ title: "Prayer Settings", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
            </Stack.Navigator>
        </NavigationContainer>
    </View>
}
