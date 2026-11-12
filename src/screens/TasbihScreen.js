import * as React from 'react';
import CustomHeader from '@/components/CustomHeader'
import { Text, View, TouchableOpacity, Modal, TouchableHighlight } from 'react-native'
import { useColors, useIsBrightTheme } from "@/constants/Colors";
import { textStyles } from '@/constants/Fonts';
import { t, getDirectionalMixedSpacing } from '@/locales/i18n';
import { Feather } from '@expo/vector-icons';
import { useAudio } from '@/utils/audio/Sounds';
import { ThemedBackground } from '@/components/ThemedBackground';
import { StarSvgFilled } from '@/components/svg/StarSvg';
import vibrationManager from '@/utils/Vibration';
import { useTasbih, getCounterDisplayName } from '@/utils/TasbihStore';
import TasbihCountersSheet from '@/components/tasbih/TasbihCountersSheet';
import TasbihStatsSheet from '@/components/tasbih/TasbihStatsSheet';

export default function TasbihScreen({ route, navigation }) {
  const colors = useColors();
  const { active, increment, resetActive, stats, setDailyGoal } = useTasbih();
  const player = useAudio();
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [statsVisible, setStatsVisible] = React.useState(false);
  const [resetVisible, setResetVisible] = React.useState(false);
  const [resetRounds, setResetRounds] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="tasbih-screen">
      <ThemedBackground variant={2} />
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
            paddingVertical: 24,
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

            {active?.rounds > 0 ? (
              <TouchableOpacity
                onPress={() => setResetRounds((v) => !v)}
                style={{ flexDirection: "row", alignItems: "center", marginTop: 16, paddingHorizontal: 15 }}
              >
                <Feather name={resetRounds ? "check-square" : "square"} size={20} color={colors.DYellow} />
                <Text style={[
                  textStyles.base,
                  { color: colors.DGreen, ...getDirectionalMixedSpacing({ marginLeft: 8 }) }
                ]}>{t('counter.alsoResetRounds')}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={{ flexDirection: "row-reverse", width: "100%", marginTop: 20, justifyContent: "space-around" }}>
              <TouchableHighlight
                onPress={() => {
                  resetActive(resetRounds)
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

      <CustomHeader
        title={t('app.tasbih')}
        isHome={true}
        navigation={navigation}
        Left={() => {
          return <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 12 }}>
            <TouchableOpacity
              testID="tasbih-stats-button"
              onPress={() => setStatsVisible(true)}
              style={{ paddingHorizontal: 8 }}>
              <Feather name="bar-chart-2" color={colors.BYellow} size={26} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setResetRounds(false)
                setResetVisible(true)
              }}
              style={{ paddingHorizontal: 8 }}>
              <Feather name="rotate-cw" color={colors.BYellow} size={26} />
            </TouchableOpacity>
          </View>
        }}
      />

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

      {stats?.dailyGoal > 0 && (
        <TouchableOpacity
          testID="tasbih-goal-progress"
          onPress={() => setStatsVisible(true)}
          style={{ alignItems: "center", justifyContent: "center", marginBottom: 8 }}
        >
          <Text style={[textStyles.base, { color: colors.BYellow, fontSize: 13, opacity: 0.85 }]}>
            {t('counter.todayProgress') + ': ' + stats.todayTotal + ' / ' + stats.dailyGoal}
          </Text>
        </TouchableOpacity>
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
      <TasbihStatsSheet
        visible={statsVisible}
        onClose={() => setStatsVisible(false)}
        stats={stats}
        onSetDailyGoal={setDailyGoal}
      />
    </View>
  );
}
