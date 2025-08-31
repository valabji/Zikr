import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, I18nManager } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors } from "../constants/Colors";
import { t } from '../locales/i18n';
// import Azkar from '../constants/Azkar.js';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mystore } from '../redux/store';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
// import React9Slice from 'react-9-slice';
// import ImageCapInset from 'react-native-image-capinsets';
const width = Dimensions.get("screen").width

export default function HomeScreen({ navigation }) {
  const colors = useColors();
  const [s, setS] = React.useState(false)
  const [ft, setFt] = React.useState(true)
  const [Azkar, setAzkar] = React.useState(mystore.getState().obj.Azkar)

  const Item = ({ name, onPress, fav, index }) => {
    let size = 32
    const [fv, setFv] = React.useState(fav)
    return <TouchableOpacity
      testID="favorite-item"
      onPress={onPress}
      style={{
        width: width - 20,
        height: 48,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        backgroundColor: colors.DGreen,
        flexDirection: "row",
      }}>
      {I18nManager.isRTL ? (
        <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={48} height={48} />
      ) : (
        <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={48} height={48} />
      )}
      <View style={{ 
        justifyContent: "center",
        flex: 1,
        paddingHorizontal: 2
      }} >
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{
          color: colors.BYellow,
          fontSize: 16,
          textAlign: "left",
          fontFamily: "Cairo_400Regular",
        }}>{name}</Text>
      </View>
      <TouchableOpacity
        testID="unfavorite-button"
        onPress={() => {
          var Azkar2 = []
          for (let i = 0; i < Azkar.length; i++) {
            if (i == index) {
              let o = {}
              Object.keys(Azkar[i]).forEach(e => {
                o[e] = Azkar[i][e]
              });
              o["fav"] = !fv
              Azkar2.push(o)
            } else {
              Azkar2.push(Azkar[i])
            }
            // Azkar2.push(Azkar[i])
          }
          // Azkar2[index].fav = !fv
          Azkar2 = JSON.parse(JSON.stringify(Azkar2))
          setFv(!fv)
          global.zikr = JSON.stringify(Azkar2)
          mystore.dispatch({ type: 'change', "obj": { "Azkar": Azkar2 } })
          AsyncStorage.setItem("@zikr", JSON.stringify(Azkar2))
        }}
        style={{ 
          width: 48, 
          height: 48, 
          alignItems: "center", 
          justifyContent: "center",
          marginRight: 5
        }} >
        <AntDesign name={fv ? "heart" : "hearto"} color={colors.BYellow} size={32} />
      </TouchableOpacity>
    </TouchableOpacity>
  }

  const chaged = () => {
    try {
      setAzkar(mystore.getState().obj.Azkar)
    } catch (e) {

    }
  }
  
  if (ft) {
    setFt(false)
    mystore.subscribe(chaged)
  }
  let p = ""
  return (
    <View style={{ flex: 1 }} testID="fav-screen-container">
      <CustomHeader title={t('app.name')} isHome={true} navigation={navigation} />
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
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: colors.BGreen }}
      >
        <ScrollView 
          style={{ flex: 1, width: "100%" }} 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {Azkar.filter(i => i.fav).length === 0 ? 
            <View testID="empty-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.BYellow, fontSize: 18, textAlign: 'center' }}>
                {t('no.favorites')}
              </Text>
            </View>
            :
            Azkar.map((i, index) => {
              if (i.fav)
                return <Item 
                  key={index} 
                  name={i.category} 
                  fav={i.fav == true} 
                  index={index} 
                  onPress={() => {
                    navigation.navigate("Screen2", { name: i.category })
                  }} 
                />
            })
          }
        </ScrollView>

      </ImageBackground>
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null,
};
