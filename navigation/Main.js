
import { NavigationContainer } from '@react-navigation/native';
import linkingOptions from './useLinking';
import Screen2 from '../screens/Screen2';
import { DNav } from './DrawerNavigation';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import Colors from '../constants/Colors';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';
import analytics from '@react-native-firebase/analytics';


export const AppContainer = () => {
    const Stack = createStackNavigator();
    analytics().logAppOpen();
    analytics().logEvent('App_Loaded_Successfully', {
        version: Constants.manifest.version,
        platform: Platform.OS,
    });
    return <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
        <NavigationContainer
            linking={linkingOptions}>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
                <Stack.Screen name="Screen2" component={Screen2} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
            </Stack.Navigator>
        </NavigationContainer>
    </View>
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? Constants.statusBarHeight : 0,
        backgroundColor: Colors.DGreen,
    },
});
