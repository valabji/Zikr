
import { NavigationContainer } from '@react-navigation/native';
import linkingOptions from './useLinking';
import Screen2 from '../screens/Screen2';
import ContributeScreen from '../screens/ContributeScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QiblaScreen from '../screens/QiblaScreen';
import UnifiedPrayerSettingsScreen from '../screens/UnifiedPrayerSettingsScreen';
import { DNav } from './DrawerNavigation';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useColors, useIsBrightTheme } from '../constants/Colors';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';


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
            <Stack.Navigator>
                <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="Screen2" component={Screen2} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="Contribute" component={ContributeScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} options={{ title: "Prayer Times", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="Qibla" component={QiblaScreen} options={{ title: "Qibla", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
                <Stack.Screen name="UnifiedPrayerSettings" component={UnifiedPrayerSettingsScreen} options={{ title: "Prayer Settings", headerShown: false, headerStyle: { backgroundColor: colors.headerBackground } }} />
            </Stack.Navigator>
        </NavigationContainer>
    </View>
}
