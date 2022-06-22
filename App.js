import * as React from 'react';
import { Platform, StatusBar, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer'
import MainScreen from './screens/MainScreen'
import Fav from './screens/Fav'
import Screen3 from './screens/Screen3'
import useLinking from './navigation/useLinking';
import Clrs from "./constants/Colors";
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import Screen2 from './screens/Screen2';
import Constants from 'expo-constants';
import Azkar from './constants/Azkar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import { I18nManager } from "react-native";
import { Restart } from 'fiction-expo-restart';

const change = createAction('change')
const changeReducer = createReducer({ "obj": { "x": "y", "ActiveS": true, "Azkar": [], "RandomNoti": 2342 } }, {
  [change]: (state, action) => {
    state.obj = action.obj
    return state
  },
})
export const mystore = configureStore({ reducer: changeReducer })

const Stack = createStackNavigator();

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);
  const [initialNavigationState, setInitialNavigationState] = React.useState();
  const containerRef = React.useRef();
  const { getInitialState } = useLinking(containerRef);

  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
  });
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();
        setInitialNavigationState(await getInitialState());
        await Font.loadAsync({
          ...Ionicons.font,
          'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {

        AsyncStorage.getItem("@zikr").then(res => {
          global.zikr = res
          mystore.dispatch({ type: 'change', "obj": { "Azkar": res != undefined ? JSON.parse(res) : Azkar } })
          if (I18nManager.isRTL) {
            I18nManager.forceRTL(false);
            I18nManager.allowRTL(false);
            Restart()
          }
          setLoadingComplete(true);
          // SplashScreen.hide();
          SplashScreen.hideAsync();
        })
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
        <NavigationContainer ref={containerRef} initialState={initialNavigationState}>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={DNav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
            <Stack.Screen name="Screen2" component={Screen2} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  }
}
const Drawer = createDrawerNavigator();
function DNav() {
  return (
    <Drawer.Navigator initialRouteName="Screen3"
      drawerType="slide"
      drawerPosition="right"
      drawerContent={({ navigation }) => <View
        style={{ width: "100%", height: "100%", backgroundColor: Clrs.BGreen }}>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
          <Image
            source={require("./assets/images/logo.png")}
            style={{ width: 128, height: 128 }}
          />
        </View>
        <Text style={{ textAlign: 'center', fontFamily: "Cairo_400Regular", fontWeight: "500", color: Clrs.BYellow, fontSize: 18 }}>{"تطبيق ذِكْر"}</Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Screen3")
          }}
          style={{
            // width: "100%",
            height: 64,
            marginLeft: 5,
            marginRight: 5,
            marginTop: 30,
            backgroundColor: Clrs.DGreen,
            flexDirection: "row-reverse",
          }}>
          <Image
            source={require("./assets/images/muslim.png")}
            style={{
              width: 64, height: 64
            }}
          />
          <Text style={{
            color: Clrs.BYellow,
            fontSize: 22,
            marginTop: 7,
            fontFamily: "Cairo_400Regular",
          }}>{"المسبحة"}</Text>
          <View style={{ flex: 1 }} />
          <Feather name="target" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20 }} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Fav")
          }}
          style={{
            // width: "100%",
            height: 64,
            marginLeft: 5,
            marginRight: 5,
            marginTop: 5,
            backgroundColor: Clrs.DGreen,
            flexDirection: "row-reverse",
          }}>
          <Image
            source={require("./assets/images/muslim.png")}
            style={{
              width: 64, height: 64
            }}
          />
          <Text style={{
            color: Clrs.BYellow,
            fontSize: 22,
            marginTop: 7,
            fontFamily: "Cairo_400Regular",
          }}>{"الاذكار المفضلة"}</Text>
          <View style={{ flex: 1 }} />
          <Feather name="heart" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20 }} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Home")
          }}
          style={{
            // width: "100%",
            height: 64,
            marginLeft: 5,
            marginRight: 5,
            marginTop: 5,
            backgroundColor: Clrs.DGreen,
            flexDirection: "row-reverse",
          }}>
          <Image
            source={require("./assets/images/muslim.png")}
            style={{
              width: 64, height: 64
            }}
          />
          <Text style={{
            color: Clrs.BYellow,
            fontSize: 22,
            marginTop: 7,
            fontFamily: "Cairo_400Regular",
          }}>{"كل الاذكار"}</Text>
          <View style={{ flex: 1 }} />
          <Feather name="list" size={24} color={Clrs.BYellow} style={{ marginTop: 17, marginLeft: 20 }} />
        </TouchableOpacity>
      </View>}
    >
      <Drawer.Screen name="Screen3" component={Screen3} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
      <Drawer.Screen name="Home" component={MainScreen} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }} />
      <Drawer.Screen name="Fav" component={Fav} options={{ title: "Zikr", headerShown: false, headerStyle: { backgroundColor: "#ddd" } }}/>
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: Clrs.DGreen,
  },
});
