import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TouchableHighlight, StyleSheet } from 'react-native'
import { StackActions } from '@react-navigation/native';
import Clrs from "../constants/Colors";
import Azkar from '../constants/Azkar.js';
import Swiper from 'react-native-web-swiper'
import Colors from '../constants/Colors';

export default function Screen2({ route, navigation }) {
  const name = route.params.name
  const swiperRef = React.useRef(null);
  let size = 0;

  const Item = ({ zx, pn }) => {
    let z = { ...zx }
    if (z.count == 0 || z.count == "" || z.count == null || z.count == undefined) {
      z.count = 1
    }
    const [i, setI] = React.useState(0)
    return <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={() => {
          if (i < z.count) {
            setI(i + 1)
            if (i == z.count - 1) {
              swiperRef.current.goToNext();
            }
          }
        }}
        style={{ height: "100%" }}>
        <Text style={{
          color: Clrs.BYellow,
          fontSize: 14,
          marginTop: 6,
          fontFamily: "Cairo_400Regular",
        }}>{z.zekr}</Text>
        <View style={{ borderTopWidth: 1, marginTop: 20, height: 1, width: "100%", borderStyle: "dashed" }} />
        {z.reference != "" &&
          <Text style={{
            color: Clrs.BYellow,
            fontSize: 14,
            marginTop: 26,
            fontFamily: "Cairo_400Regular",
          }}> المرجع : {z.reference}</Text>}
        <Text style={{
          color: Clrs.BYellow,
          fontSize: 14,
          marginTop: 6,
          fontFamily: "Cairo_400Regular",
        }}>{z.description}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ borderTopWidth: 0, height: 0, width: "100%", borderStyle: "dotted" }} />
        <View style={{ flex: 1 }} />
        <View style={{ height: 96, flexDirection: "row-reverse" }}>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}

          >
            <Text
              style={{
                textAlign: "right",
                fontFamily: "Cairo_400Regular",
                color: Clrs.BYellow,
                fontSize: 18,
              }}
            >صفحة {pn} من {size}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <ImageBackground
            source={require("../assets/images/Star.png")}
            style={{ width: 96, height: 96, alignSelf: "center", justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                color: Clrs.BYellow,
                fontSize: 18,
              }}
            >{i} / {z.count}</Text>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    </ScrollView>
  }


  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title={name} isHome={false} navigation={navigation} />
        <View style={{ flex: 1, height: "100%", width: "100%",backgroundColor:Colors.tabIconDefault }}>
          <Swiper ref={swiperRef} style={{ flex: 1 }} loop={false} controlsEnabled={false}  >
            {Azkar.map((i, index) => {
              if (i.category == name) {
                size++
                return <View key={Math.random() * 9999} style={{ flex: 1 }}>
                  <View style={{
                    flex: 1,borderRadius: 10, borderWidth: 1, borderColor: Clrs.BYellow, borderStyle: "dashed",margin: 7, 
                  }}>
                    <ImageBackground
                      source={require("../assets/images/bg.jpg")}
                      imageStyle={{borderRadius:10}}
                      style={{ flex: 1, padding: 10,borderRadius: 10,  resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: Clrs.BGreen }}
                    >
                      <Item zx={i} pn={size} />
                    </ImageBackground>
                  </View>
                </View>
              }
            })}
          </Swiper>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  slide1: {
    flex: 1,
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  }
})
