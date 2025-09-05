import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColors } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getRTLTextAlign } from '../locales/i18n';
import { useAudio } from '../utils/Sounds.js';
import { StarSvgFilled } from '../components/StarSvg';
import vibrationManager from '../utils/Vibration';

export default function AzkarOnePageScroll({ azkarList, zikrFontSize }) {
  const colors = useColors();
  const player = useAudio();

  const Item = ({ z, pn, totalCount }) => {
    if (z.count == 0 || z.count == "" || z.count == null || z.count == undefined) {
      z.count = 1;
    }
    const [i, setI] = React.useState(0);

    return (
      <View style={{
        borderWidth: 1,
        borderColor: colors.BYellow,
        margin: 7,
        borderStyle: "dashed",
        padding: 10,
        borderRadius: 10,
        minHeight: 200
      }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (i < z.count) {
              player.playClick();
              setI(i + 1);
              vibrationManager.vibrateForAzkarCount();
              if (i == z.count - 1) {
                vibrationManager.vibrateForNextZikr();
              }
            }
          }}
          style={{ flex: 1 }}
        >
          <Text style={[
            textStyles.bodySmall,
            {
              color: colors.BYellow,
              marginTop: 6,
              fontSize: zikrFontSize,
              textAlign: getRTLTextAlign('left'),
              writingDirection: isRTL() ? "rtl" : "ltr"
            }
          ]}>{z.zekr}</Text>

          <View style={{
            borderTopWidth: 1,
            marginTop: 20,
            height: 1,
            width: "100%",
            borderColor: colors.BYellow,
            borderStyle: "solid"
          }} />

          {z.reference != "" &&
            <Text style={[
              textStyles.bodySmall,
              {
                color: colors.BYellow,
                marginTop: 26,
              }
            ]}>{t('zikr.reference', { text: z.reference })}</Text>
          }

          <Text style={[
            textStyles.bodySmall,
            {
              color: colors.BYellow,
              marginTop: 6,
            }
          ]}>{z.description}</Text>

          <View style={{ height: 20 }} />

          <View style={{
            height: 96,
            flexDirection: "row-reverse",
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center"
            }}>
              <Text
                style={[
                  textStyles.body,
                  {
                    textAlign: "right",
                    color: colors.BYellow,
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
    <ScrollView
      style={{ flex: 1, width: '100%', marginBottom: 40 }}
      contentContainerStyle={{
        paddingBottom: 40,
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
  );
}
