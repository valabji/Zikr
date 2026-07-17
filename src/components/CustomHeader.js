import * as React from 'react';
import { Dimensions, Image, Text, View, I18nManager } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { t, isRTL, getDirectionalSpacing } from '@/locales/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from "@/constants/Colors";
import { textStyles } from '@/constants/Fonts';
import Svg, { Defs, Path, ClipPath, Use } from "react-native-svg"
import { PatternSvg } from '@/components/svg/PatternSvg';
const width = Dimensions.get("window").width

export default function CustomHeader({ title, isHome, Left, Right, navigation, testID, onBackPress=null }) {
  const colors = useColors();

  return (
    <LinearGradient
      testID={testID || "header-container"}
      colors={colors.headerGradient || [colors.BGreen, colors.DGreen]}
      start={colors.headerGradient ? { x: 0, y: 0 } : undefined}
      end={colors.headerGradient ? { x: 1, y: 1 } : undefined}
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
      {colors.hidePattern ? null : (
        <View style={{ flexDirection: "row", position: "absolute", left: 0, top: 0, width, height: 64 }}>
          <PatternSvg color={(colors.patternColor || colors.DGreen) + "55"} width={width} />
          <PatternSvg color={(colors.patternColor || colors.DGreen) + "55"} width={width} />
        </View>
      )}
      {colors.headerImage ? (
        <Image
          source={{ uri: colors.headerImage }}
          style={{ position: "absolute", left: 0, top: 0, width, height: 64 }}
          resizeMode="cover"
        />
      ) : null}
      {
        Right ?
          <Right /> :
          isHome ?
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TouchableOpacity
                testID="menu-button"
                onPress={() => navigation.toggleDrawer ? navigation.toggleDrawer() : navigation.navigate('HomeGrid')}
                style={{ flexDirection: "row" }}
              >
                <Ionicons
                  name={navigation.toggleDrawer ? "menu" : "grid-outline"}
                  size={navigation.toggleDrawer ? 30 : 26}
                  style={{ ...getDirectionalSpacing(20, 0) }}
                  color={colors.BYellow}
                />
              </TouchableOpacity>
            </View>
            :
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TouchableOpacity
                testID="back-button"
                onPress={() => onBackPress ? onBackPress() : navigation.goBack()}
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
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={[textStyles.header, { textAlign: 'center', color: colors.BYellow }]}>{title}</Text>
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
