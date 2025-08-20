
import { NavigationContainer } from '@react-navigation/native';
import linkingOptions from './useLinking';
import Screen2 from '../screens/Screen2';
import AuthScreen from '../screens/AuthScreen';
import ContributionScreen from '../screens/ContributionScreen';
import { DNav } from './DrawerNavigation';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import Colors from '../constants/Colors';
import Constants from 'expo-constants';
import { createStackNavigator } from '@react-navigation/stack';


export const AppContainer = () => {
    const Stack = createStackNavigator();
    return <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
        <NavigationContainer
            linking={linkingOptions}>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
                <Stack.Screen name="Screen2" component={Screen2} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
                <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Auth", headerShown: false }} />
                <Stack.Screen name="Contribute" component={ContributionScreen} options={{ title: "Contribute", headerShown: false }} />
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
