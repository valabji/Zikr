import * as React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, getDirectionalMixedSpacing, isRTL, toArabicDigits } from '@/locales/i18n';
import { TASBIH_CONSTANTS } from '@/constants/TasbihConstants';

const WEEKDAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function GoalChips({ value, onChange, colors, fmtNum }) {
  const presets = [...TASBIH_CONSTANTS.DAILY_GOAL_PRESETS, 0];
  const isCustom = value > 0 && !TASBIH_CONSTANTS.DAILY_GOAL_PRESETS.includes(value);
  const [custom, setCustom] = React.useState(isCustom ? String(value) : '');

  const commitCustom = () => {
    const n = parseInt(custom, 10);
    if (!isNaN(n) && n > 0) onChange(n);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {presets.map((p) => {
        const active = value === p;
        const label = p === 0 ? t('counter.noGoal') : fmtNum(p);
        return (
          <TouchableOpacity
            key={p}
            onPress={() => onChange(p)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginTop: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.accent + '44',
              backgroundColor: active ? colors.accent + '22' : 'transparent',
              ...getDirectionalMixedSpacing({ marginRight: 8 }),
            }}
          >
            <Text style={[textStyles.base, { color: active ? colors.accent : colors.text, fontSize: 14 }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      <TextInput
        value={custom}
        onChangeText={setCustom}
        onEndEditing={commitCustom}
        onSubmitEditing={commitCustom}
        placeholder={t('counter.custom')}
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        style={[
          textStyles.base,
          {
            color: isCustom ? colors.accent : colors.text,
            fontSize: 14,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginTop: 6,
            minWidth: 70,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isCustom ? colors.accent : colors.accent + '44',
          },
        ]}
      />
    </View>
  );
}

export default function TasbihStatsSheet({ visible, onClose, stats, onSetDailyGoal }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : String(n));
  const last7Days = (stats && stats.last7Days) || [];
  const maxCount = Math.max(1, ...last7Days.map((d) => d.count));

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayBackground }}>
          <TouchableWithoutFeedback>
            <View
              testID="tasbih-stats-sheet"
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '85%',
                paddingBottom: 24,
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.accent + '22',
                }}
              >
                <Text style={[textStyles.subtitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {t('counter.stats')}
                </Text>
                <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
                  <Feather name="x" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 18 }}>
                <View style={{
                  backgroundColor: colors.accent + '14',
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 14,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={[textStyles.subtitle, { color: colors.text }]}>{t('counter.todayProgress')}</Text>
                    <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13 }]}>
                      {fmtNum(stats.todayTotal)} / {stats.dailyGoal > 0 ? fmtNum(stats.dailyGoal) : t('counter.noGoal')}
                    </Text>
                  </View>
                  {stats.dailyGoal > 0 ? (
                    <View style={{ height: 8, backgroundColor: colors.accent + '33', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${stats.goalPct}%`,
                        backgroundColor: colors.accent,
                        borderRadius: 4,
                      }} />
                    </View>
                  ) : null}
                </View>

                <View style={{
                  backgroundColor: colors.accent + '14',
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 14,
                }}>
                  <Text style={[textStyles.subtitle, { color: colors.text, marginBottom: 12 }]}>
                    {t('counter.weeklyChart')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
                    {last7Days.map((d) => {
                      const barHeight = Math.max(4, Math.round((d.count / maxCount) * 64));
                      const weekday = new Date(d.date + 'T00:00:00').getDay();
                      const weekdayLabel = lang === 'ar' ? WEEKDAY_AR[weekday] : WEEKDAY_EN[weekday];
                      return (
                        <View key={d.date} style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={[textStyles.base, { color: colors.accent, fontSize: 11, marginBottom: 4 }]}>
                            {d.count > 0 ? fmtNum(d.count) : ''}
                          </Text>
                          <View style={{
                            width: 14,
                            height: barHeight,
                            borderRadius: 4,
                            backgroundColor: colors.accent + (d.count > 0 ? 'ff' : '33'),
                          }} />
                          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 10, marginTop: 6 }]}>
                            {weekdayLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={{
                  backgroundColor: colors.accent + '14',
                  borderRadius: 12,
                  padding: 18,
                }}>
                  <Text style={[textStyles.subtitle, { color: colors.text, marginBottom: 4 }]}>
                    {t('counter.dailyGoal')}
                  </Text>
                  <GoalChips value={stats.dailyGoal || 0} onChange={onSetDailyGoal} colors={colors} fmtNum={fmtNum} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
