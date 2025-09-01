import * as React from 'react';
import { Dimensions, Text, View, I18nManager } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { t, isRTL, getDirectionalSpacing } from '../locales/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from "../constants/Colors";
import Svg, { Defs, Path, ClipPath, Use } from "react-native-svg"
import { Hbg } from './Hbg';
const width = Dimensions.get("window").width

export default function CustomHeader({ title, isHome, Left, Right, navigation, testID }) {
  const colors = useColors();

  return (
    <LinearGradient
      testID={testID || "header-container"}
      colors={[colors.BGreen, colors.DGreen]}
      locations={[0, 1]}
      style={{
        flexDirection: "row",
        height: 64,
        elevation: 1,

        shadowColor: colors.shadowColor,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,
      }}>
      <View style={{ flexDirection: "row", position: "absolute", left: 0, top: 0, width, height: 64 }}>
        <Hbg color={colors.DGreen + "55"} width={width} />
        <Hbg color={colors.DGreen + "55"} width={width} />
      </View>
      {
        Right ?
          <Right /> :
          isHome ?
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TouchableOpacity
                testID="menu-button"
                onPress={() => navigation.toggleDrawer()}
                style={{ flexDirection: "row" }}
              >
                <Ionicons
                  name="menu"
                  size={30}
                  style={{ ...getDirectionalSpacing(20, 0) }}
                  color={colors.BYellow}
                />
              </TouchableOpacity>
            </View>
            :
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TouchableOpacity
                testID="back-button"
                onPress={() => navigation.goBack()}
                style={{ flexDirection: "row" }}
              >
                <Feather
                  name={isRTL() ? "arrow-right" : "arrow-left"}
                  size={30}
                  style={{ ...getDirectionalSpacing(20, 0) }}
                  color={colors.BYellow}
                />
              </TouchableOpacity>
            </View>
      }
      <View style={{ flex: 1.5, justifyContent: 'center' }}>
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ textAlign: 'center', fontFamily: "Cairo_400Regular", fontWeight: "normal", color: colors.BYellow, fontSize: 18 }}>{title}</Text>
      </View>

      {Left ?
        <View style={{ flex: 1 }}>
          <Left />
        </View>
        :
        <View style={{ flex: 1 }}></View>
      }
    </LinearGradient>
  )
}
