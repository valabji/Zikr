import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, TouchableOpacity, Modal, TouchableHighlight } from 'react-native'
import { useColors, useIsBrightTheme } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing } from '../locales/i18n';
import { Feather } from '@expo/vector-icons';
import { useAudio } from '../utils/Sounds';
import { BackgroundSvg2 } from '../components/BackgroundSvg2';
import { StarSvgFilled } from '../components/StarSvg';
import vibrationManager from '../utils/Vibration';
import { useTasbih, getCounterDisplayName } from '../utils/TasbihStore';
import TasbihCountersSheet from '../components/TasbihCountersSheet';

export default function Screen3({ route, navigation }) {
  const colors = useColors();
  const { active, increment, resetActive } = useTasbih();
  const player = useAudio();
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [resetVisible, setResetVisible] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="tasbih-screen">
      <BackgroundSvg2 color={colors.BYellow} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={resetVisible}
        onRequestClose={() => {
          setResetVisible(false)
        }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={{
            backgroundColor: colors.white,
            shadowColor: colors.shadowColor,
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.20,
            shadowRadius: 1.41,
            justifyContent: "center",
            alignItems: "center",
            elevation: 2,
            width: 240,
            height: 220,
            borderRadius: 20,
          }}>
            <Feather name="info" size={64} color={colors.DYellow} />
            <Text style={[
              textStyles.subtitle,
              {
                color: colors.DGreen,
                textAlign: "center",
                marginTop: 10,
                ...getDirectionalMixedSpacing({ marginRight: 15, marginLeft: 15 }),
              }
            ]}
            >{t('counter.resetConfirmation')}</Text>

            <View style={{ flexDirection: "row-reverse", width: "100%", marginTop: 20, justifyContent: "space-around" }}>
              <TouchableHighlight
                onPress={() => {
                  resetActive()
                  setResetVisible(false)
                }}
                style={{ backgroundColor: colors.DYellow, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={[
                  textStyles.subtitle,
                  {
                    color: colors.DGreen,
                    lineHeight: 28,
                  }
                ]}>{t('counter.yes')}</Text>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={() => {
                  setResetVisible(false)
                }}
                style={{ backgroundColor: colors.BGreen, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={[
                  textStyles.subtitle,
                  {
                    color: colors.BYellow,
                    lineHeight: 28,
                  }
                ]}>{t('counter.no')}</Text>
              </TouchableHighlight>

            </View>
          </View>
        </View>
      </Modal>

      <CustomHeader title={t('app.tasbih')} isHome={true} navigation={navigation} Left={() => {
        return <TouchableOpacity
          onPress={() => {
            setResetVisible(true)
          }}
          style={{ flex: 1, justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 20 }}>
          <Feather name="rotate-cw" color={colors.BYellow} size={32} />
        </TouchableOpacity>
      }} />

      <TouchableOpacity
        testID="tasbih-active-name"
        onPress={() => setSheetVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        <Text style={[
          textStyles.subtitle,
          { color: colors.BYellow, ...getDirectionalMixedSpacing({ marginRight: 8 }) }
        ]}>{getCounterDisplayName(active)}</Text>
        <Feather name="chevron-down" color={colors.BYellow} size={20} />
      </TouchableOpacity>

      {active?.target > 0 && (
        <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <Text style={[textStyles.base, { color: colors.BYellow, fontSize: 16 }]}>
            {active.count + ' / ' + active.target}
          </Text>
          <Text style={[textStyles.base, { color: colors.BYellow, fontSize: 13, opacity: 0.8, marginTop: 2 }]}>
            {t('counter.rounds') + ': ' + (active.rounds || 0)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity
          testID="tasbih-counter-button"
          onPressIn={() => {
            const res = increment();
            player.playClick();
            if (res && res.completed) {
              vibrationManager.vibrateForTasbihComplete();
            } else {
              vibrationManager.vibrateForTasbih();
            }
          }}
          style={{ flex: 1, justifyContent: "center", width: "100%", alignItems: "center" }}
        >
          <View style={{ width: 256, height: 256, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
            <StarSvgFilled width={256} height={256} />
            <Text
              testID="tasbih-counter-value"
              style={[
                textStyles.base,
                {
                  position: 'absolute',
                  color: colors.primary,
                  fontSize: 32,
                  fontWeight: 'bold',
                }
              ]}
            >{active ? active.count : 0}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TasbihCountersSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
}
