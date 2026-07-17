
import { NavigationContainer } from '@react-navigation/native';
import linkingOptions from './useLinking';
import AzkarDetailScreen from '@/screens/azkar/AzkarDetailScreen';
import ContributeScreen from '@/screens/ContributeScreen';
import AboutScreen from '@/screens/AboutScreen';
import CreditsScreen from '@/screens/CreditsScreen';
import UnifiedPrayerSettingsScreen from '@/screens/prayer/UnifiedPrayerSettingsScreen';
import ThemeManagerScreen from '@/screens/theme/ThemeManagerScreen';
import ThemeEditorScreen from '@/screens/theme/ThemeEditorScreen';
import { DrawerNavigation } from './DrawerNavigation';
import { TabNavigation } from './TabNavigation';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useColors, useIsBrightTheme } from '@/constants/Colors';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '@/screens/SettingsScreen';
import RadioMiniPlayer from '@/components/RadioMiniPlayer';
import LogEvent from '@/utils/firebase/events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { NavModeContext } from '@/utils/NavMode';
import { APP_KEYS } from '@/constants/StorageKeys';


export const AppContainer = () => {
    const colors = useColors();
    const isBrightTheme = useIsBrightTheme();
    const Stack = createStackNavigator();
    const [navMode, setNavMode] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem(APP_KEYS.NAV_MODE).then(m => setNavMode(m === 'cards' ? 'cards' : 'drawer'));
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: Constants.statusBarHeight,
            backgroundColor: colors.DGreen,
        },
    });

    if (navMode === null) {
        return null;
    }

    return <View style={styles.container}>
        <StatusBar barStyle={isBrightTheme ? "dark-content" : "light-content"} backgroundColor={colors.DGreen} />
        <NavModeContext.Provider value={{ navMode, setNavMode }}>
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
                <Stack.Screen name="Home" component={navMode === 'cards' ? TabNavigation : DrawerNavigation} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="AzkarDetail" component={AzkarDetailScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="Contribute" component={ContributeScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="About" component={AboutScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="Credits" component={CreditsScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="UnifiedPrayerSettings" component={UnifiedPrayerSettingsScreen} options={{ title: "Prayer Settings", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="ThemeManager" component={ThemeManagerScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="ThemeEditor" component={ThemeEditorScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
            </Stack.Navigator>
            <RadioMiniPlayer />
        </NavigationContainer>
        </NavModeContext.Provider>
    </View>
}
