import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground } from 'react-native'
import { StackActions } from '@react-navigation/native';
import Clrs from "../constants/Colors";
// import React9Slice from 'react-9-slice';
// import ImageCapInset from 'react-native-image-capinsets';

export default function HomeScreen({ navigation }) {

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title="تجربة رقم 1" isHome={true} navigation={navigation} />
      {/* <React9Slice width={256}
          height={256}
          border={85}
          // image="../assets/images/bub.webp"
          imageSize={{ x: 1024, y: 512 }}>
          HELLO WORLD!
        </React9Slice> */}
      {/* <ImageCapInset
        source={require("../assets/images/bg.png")}
        capInsets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      /> */}
      <ImageBackground
        // source={require("../assets/images/bg.png")}
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: Clrs.BGreen }}
      >
        <Text style={{ fontSize: 24, marginBottom: 10, marginTop: 20, color: Clrs.BYellow }} onPress={() => navigation.toggleDrawer()} >Welcome To Home Screen</Text>
        <Text style={{ fontSize: 14, marginBottom: 10, marginTop: 60, color: Clrs.BYellow }} onPress={() => navigation.dispatch(StackActions.replace('Root'))} >Logout</Text>
      </ImageBackground>
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null,
};
