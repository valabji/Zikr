import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Swiper from 'react-native-web-swiper';
import { Feather } from '@expo/vector-icons';
import { useColors, getItemColors } from "@/constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, getRTLTextAlign } from '@/locales/i18n';
import { useAudio } from '@/utils/Sounds.js';
import { StarSvgFilled } from '@/components/StarSvg';
import vibrationManager from '@/utils/Vibration';
import { logAzkarCompletion } from '@/utils/AzkarHistory';
import ShareCardModal from './ShareCardModal';

export default function AzkarSwiper({ azkarList, zikrFontSize }) {
  const colors = useColors();
  const player = useAudio();
  const reverse = Platform.OS === 'web' && isRTL();
  const swp = React.useRef(null);
  const size = azkarList.length;
  const [shareItem, setShareItem] = React.useState(null);

  const Item = ({ z, pn }) => {
    if (z.count == 0 || z.count == "" || z.count == null || z.count == undefined) {
      z.count = 1;
    }
    const [i, setI] = React.useState(0);
    const g = getItemColors(colors, pn - 1);
    const fg = g ? g.fg : colors.BYellow;

    return (
      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (i < z.count) {
              player.playClick();
              setI(i + 1);
              if (i == z.count - 1) {
                vibrationManager.vibrateForNextZikr();
                if (pn === size) {
                  logAzkarCompletion(z.category);
                }
                // react-native-web-swiper navigation
                if (reverse) {
                  let next = size - pn - 1;
                  if (swp?.current && swp?.current?.goTo) {
                    swp.current.goTo(next);
                  }
                } else {
                  let next = pn; // Move to next slide (pn is 1-indexed, but goTo expects 0-indexed)
                  if (swp?.current && swp?.current?.goTo) {
                    swp.current.goTo(next);
                  }
                }
              } else {
                vibrationManager.vibrateForAzkarCount();
              }
            }
          }}
          style={{ height: "100%" }}
        >
          <Text style={[
            textStyles.bodySmall,
            {
              color: fg,
              marginTop: 6,
              fontSize: zikrFontSize,
              textAlign: getRTLTextAlign('left'),
              writingDirection: isRTL() ? "rtl" : "ltr"
            }
          ]}>{z.zekr}</Text>
          <Text style={[
            textStyles.bodySmall,
            {
              color: fg,
              marginTop: 6,
              fontSize: zikrFontSize,
              fontFamily: 'Hafs',
              textAlign: getRTLTextAlign('left'),
              writingDirection: isRTL() ? "rtl" : "ltr"
            }
          ]}>{z.quran}</Text>
          <View style={{ borderTopWidth: 1, marginTop: 20, height: 1, width: "100%", borderColor: fg, borderStyle: "solid" }} />
          {z.reference != "" &&
            <Text style={[
              textStyles.bodySmall,
              {
                color: fg,
                marginTop: 26,
              }
            ]}>{t('zikr.reference', { text: z.reference })}</Text>}
          <Text style={[
            textStyles.bodySmall,
            {
              color: fg,
              marginTop: 6,
            }
          ]}>{z.description}</Text>
          <View style={{ flex: 1 }} />
          <View style={{ borderTopWidth: 0, height: 0, width: "100%", borderStyle: "dotted" }} />
          <View style={{ flex: 1 }} />
          <View style={{ height: 96, flexDirection: "row-reverse", alignItems: "center" }}>
            <View style={{ width: 96, justifyContent: "center", alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={(e) => { e?.stopPropagation?.(); setShareItem(z); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 10 }}
              >
                <Feather name="share-2" size={22} color={fg} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text
                style={[
                  textStyles.body,
                  {
                    textAlign: "center",
                    color: fg,
                    fontSize: 18,
                  }
                ]}
              >{t('counter.page', { current: pn, total: size })}</Text>
            </View>
            <View style={{ width: 96, height: 96, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
              <StarSvgFilled width={96} height={96} />
              <Text
                testID="count-button"
                style={[
                  textStyles.body,
                  {
                    position: 'absolute',
                    color: colors.primary,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }
                ]}
              >{i} / {z.count}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={{
      flex: 1,
      width: '100%',
      height: '100%',
    }}>
      <Swiper
        ref={swp}
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
        loop={false}
        controlsEnabled={false}
        swipeControlsEnabled={true}
        from={reverse ? size - 1 : 0}
        containerStyle={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
        minDistanceForAction={0.1}
        stackDepth={1}
      >
        {azkarList.map((i, index) => {
          const g = getItemColors(colors, index);
          const slideContent = (
            <View style={{
              flex: 1, borderWidth: 1, borderColor: g ? 'transparent' : colors.BYellow, margin: 7, borderStyle: "dashed", padding: 10, borderRadius: 10, overflow: 'hidden'
            }}>
              {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
              <Item z={i} pn={index + 1} />
            </View>
          );

          return (
            <View key={index} style={{
              flex: 1,
              width: '100%',
              height: '100%',
              minHeight: 400
            }} testID="azkar-item">
              {slideContent}
            </View>
          );
        })}
      </Swiper>
      <ShareCardModal
        visible={!!shareItem}
        content={shareItem ? {
          arabic: shareItem.zekr,
          quran: shareItem.quran,
          reference: shareItem.reference,
          description: shareItem.description,
        } : null}
        onClose={() => setShareItem(null)}
      />
    </View>
  );
}
