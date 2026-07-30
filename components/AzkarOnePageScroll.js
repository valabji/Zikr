import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors, getItemColors } from "../constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getRTLTextAlign } from '../locales/i18n';
import { useAudio } from '../utils/Sounds.js';
import { StarSvgFilled } from '../components/StarSvg';
import vibrationManager from '../utils/Vibration';
import { logAzkarCompletion } from '../utils/AzkarHistory';
import ShareCardModal from './ShareCardModal';

export default function AzkarOnePageScroll({ azkarList, zikrFontSize }) {
  const colors = useColors();
  const player = useAudio();
  const [shareItem, setShareItem] = React.useState(null);

  const Item = ({ z, pn, totalCount }) => {
    if (z.count == 0 || z.count == "" || z.count == null || z.count == undefined) {
      z.count = 1;
    }
    const [i, setI] = React.useState(0);
    const g = getItemColors(colors, pn - 1);
    const fg = g ? g.fg : colors.BYellow;

    return (
      <View style={{
        borderWidth: 1,
        borderColor: g ? 'transparent' : colors.BYellow,
        margin: 7,
        borderStyle: "dashed",
        padding: 10,
        borderRadius: 10,
        minHeight: 200,
        overflow: 'hidden'
      }}>
        {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (i < z.count) {
              player.playClick();
              setI(i + 1);
              vibrationManager.vibrateForAzkarCount();
              if (i == z.count - 1) {
                vibrationManager.vibrateForNextZikr();
                if (pn === totalCount) {
                  logAzkarCompletion(z.category);
                }
              }
            }
          }}
          style={{ flex: 1 }}
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
          <View style={{
            borderTopWidth: 1,
            marginTop: 20,
            height: 1,
            width: "100%",
            borderColor: fg,
            borderStyle: "solid"
          }} />

          {z.reference != "" &&
            <Text style={[
              textStyles.bodySmall,
              {
                color: fg,
                marginTop: 26,
              }
            ]}>{t('zikr.reference', { text: z.reference })}</Text>
          }

          <Text style={[
            textStyles.bodySmall,
            {
              color: fg,
              marginTop: 6,
            }
          ]}>{z.description}</Text>

          <View style={{ height: 20 }} />

          <View style={{
            height: 96,
            flexDirection: "row-reverse",
            alignItems: 'center'
          }}>
            <View style={{ width: 96, justifyContent: "center", alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={(e) => { e?.stopPropagation?.(); setShareItem(z); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 10 }}
              >
                <Feather name="share-2" size={22} color={fg} />
              </TouchableOpacity>
            </View>

            <View style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center"
            }}>
              <Text
                style={[
                  textStyles.body,
                  {
                    textAlign: "center",
                    color: fg,
                    fontSize: 18,
                  }
                ]}
              >{t('counter.page', { current: pn, total: totalCount })}</Text>
            </View>

            <View style={{
              width: 96,
              height: 96,
              justifyContent: "center",
              alignItems: "center"
            }}>
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
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          paddingBottom: 80,
          flexGrow: 1
        }}
        showsVerticalScrollIndicator={true}
      >
        {azkarList.map((item, index) => (
          <Item
            key={index}
            z={item}
            pn={index + 1}
            totalCount={azkarList.length}
          />
        ))}
      </ScrollView>
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
    </>
  );
}
