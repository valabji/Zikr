import * as React from 'react';
import { Dimensions, Text, View, I18nManager } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { t } from '../locales/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Clrs from "../constants/Colors";
import Svg, { Defs, Path, ClipPath, Use } from "react-native-svg"
import { Hbg } from './Hbg';
const width = Dimensions.get("window").width

export default function CustomHeader({ title, isHome, Left, navigation }) {
  return (
    <LinearGradient colors={[Clrs.BGreen, Clrs.DGreen]} locations={[0, 1]} style={{
      flexDirection: I18nManager.isRTL ? "row" : "row-reverse", 
      height: 64,
      elevation: 1,

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,

      elevation: 2,
    }}>
      <View style={{ flexDirection: "row", position: "absolute", left: 0, top: 0, width, height: 64 }}>
        <Hbg color={Clrs.DGreen + "55"} width={width} />
        <Hbg color={Clrs.DGreen + "55"} width={width} />
      </View>
      {Left ?
        <Left /> :
        <View style={{ flex: 1 }}></View>
      }
      <View style={{ flex: 1.5, justifyContent: 'center' }}>
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ textAlign: 'center', fontFamily: "Cairo_400Regular", fontWeight: "normal", color: Clrs.BYellow, fontSize: 18 }}>{title}</Text>
      </View>
      {
        isHome ?
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }}
            >
              <Ionicons
                name="menu"
                size={30}
                style={{ [I18nManager.isRTL ? "marginRight" : "marginLeft"]: 20 }}
                color={Clrs.BYellow}
              />
            </TouchableOpacity>
          </View>
          :
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }}
            >
              <Feather
                name={I18nManager.isRTL ? "arrow-right" : "arrow-left"}
                size={30}
                style={{ [I18nManager.isRTL ? "marginRight" : "marginLeft"]: 20 }}
                color={Clrs.BYellow}
              />
            </TouchableOpacity>
          </View>
      }
    </LinearGradient>
  )
}
