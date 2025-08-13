import * as React from 'react';
import { Platform, StatusBar, Share, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initializeLanguage, } from './locales/i18n';
import linkingOptions from './navigation/useLinking';
import Clrs from "./constants/Colors";
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import Screen2 from './screens/Screen2';
import Constants from 'expo-constants';
import Azkar from './constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DNav } from './navigation/DrawerNavigation';
import { mystore } from './redux/store';

const Stack = createStackNavigator();

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);
  // const [initialNavigationState, setInitialNavigationState] = React.useState();
  const containerRef = React.useRef();
  // const { getInitialState } = useLinking(containerRef);
  // global.azkar = JSON.stringify(Azkar)
  // Zikr.setAzkar(Azkar)

  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
  });
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();
        // setInitialNavigationState(await getInitialState());
        await Font.loadAsync({
          ...Ionicons.font,
          'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        await initializeLanguage(); // Initialize translations first
        const zikrData = await AsyncStorage.getItem("@zikr");
        global.zikr = zikrData;
        mystore.dispatch({
          type: 'change',
          obj: {
            "Azkar": zikrData != undefined ? JSON.parse(zikrData) : Azkar
          }
        });
        setLoadingComplete(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);
  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        <NavigationContainer
          linking={linkingOptions}
          ref={containerRef}>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
            <Stack.Screen name="Screen2" component={Screen2} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? Constants.statusBarHeight : 0,
    backgroundColor: Clrs.DGreen,
  },
});
