import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing } from '../locales/i18n';
import { WIRD_CONSTANTS } from '../constants/WirdConstants';
import { useWirdPlanner, setDailyTargetPages, logPagesToday, resetKhatmah } from '../utils/WirdPlanner';

export default function WirdPlannerScreen({ navigation }) {
  const colors = useColors();
  const { state, stats } = useWirdPlanner();
  const [goalInput, setGoalInput] = useState('');

  const onSaveGoal = useCallback(() => {
    const pages = parseInt(goalInput, 10);
    if (Number.isFinite(pages) && pages > 0) {
      setDailyTargetPages(pages);
      setGoalInput('');
    }
  }, [goalInput]);

  const onLogPages = useCallback((amount) => {
    logPagesToday(amount);
  }, []);

  const onResetKhatmah = useCallback(() => {
    Alert.alert(
      t('wirdPlanner.resetKhatmah'),
      t('wirdPlanner.resetKhatmahConfirm'),
      [
        { text: t('counter.no'), style: 'cancel' },
        { text: t('counter.yes'), onPress: () => resetKhatmah(), style: 'destructive' },
      ]
    );
  }, []);

  const khatmahRatio = stats.currentKhatmahProgress / WIRD_CONSTANTS.TOTAL_QURAN_PAGES;
  const todayRatio = stats.dailyTargetPages > 0 ? Math.min(1, stats.todayPages / stats.dailyTargetPages) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="wird-planner-screen">
      <CHeader navigation={navigation} isHome={true} title={t('wirdPlanner.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 8 }}>
            {t('wirdPlanner.dailyTarget')}
          </Text>
          <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary, marginBottom: 12 }}>
            {t('wirdPlanner.dailyTargetDescription')}
          </Text>

          {stats.dailyTargetPages > 0 && (
            <Text style={{ ...textStyles.body, color: colors.accent, marginBottom: 12 }}>
              {t('wirdPlanner.pagesPerDay', { count: stats.dailyTargetPages })}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              testID="wird-goal-input"
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder={t('wirdPlanner.goalPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontFamily: FONT_FAMILY,
                color: colors.text,
                textAlign: isRTL() ? 'right' : 'left',
              }}
            />
            <TouchableOpacity
              testID="wird-save-goal-button"
              onPress={onSaveGoal}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 16,
                ...getDirectionalMixedSpacing({ marginLeft: 10, marginRight: 10 }),
              }}
            >
              <Text style={{ ...textStyles.body, color: colors.primary }}>{t('wirdPlanner.setGoal')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {stats.dailyTargetPages === 0 ? (
          <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
            {t('wirdPlanner.noGoalSet')}
          </Text>
        ) : (
          <>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 8 }}>
                {t('wirdPlanner.today')}
              </Text>
              <Text style={{ ...textStyles.body, color: colors.text, marginBottom: 10 }}>
                {t('wirdPlanner.todayProgress', { read: stats.todayPages, target: stats.dailyTargetPages })}
              </Text>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }}>
                <View style={{
                  height: 8,
                  width: `${todayRatio * 100}%`,
                  backgroundColor: stats.todayTargetMet ? colors.currentPrayer : colors.accent,
                  borderRadius: 4,
                }} />
              </View>

              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                {WIRD_CONSTANTS.QUICK_LOG_AMOUNTS.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    testID={`wird-log-${amount}`}
                    onPress={() => onLogPages(amount)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primaryMedium,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: 'center',
                      marginHorizontal: 4,
                    }}
                  >
                    <Text style={{ ...textStyles.body, color: colors.text }}>+{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {stats.streak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
                  <Feather name="zap" size={16} color={colors.accent} />
                  <Text style={{
                    ...textStyles.bodySmall,
                    color: colors.accent,
                    ...getDirectionalMixedSpacing({ marginLeft: 6, marginRight: 6 }),
                  }}>
                    {stats.streak} {t('wirdPlanner.streak')}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 8 }}>
                {t('wirdPlanner.khatmahProgress')}
              </Text>
              <Text style={{ ...textStyles.body, color: colors.text, marginBottom: 10 }}>
                {t('wirdPlanner.pagesOfTotal', { progress: stats.currentKhatmahProgress, total: WIRD_CONSTANTS.TOTAL_QURAN_PAGES })}
              </Text>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }}>
                <View style={{
                  height: 8,
                  width: `${khatmahRatio * 100}%`,
                  backgroundColor: colors.accent,
                  borderRadius: 4,
                }} />
              </View>

              <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary, marginTop: 12 }}>
                {t('wirdPlanner.khatmahCount')}: {stats.khatmahCount}
              </Text>
              <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary, marginTop: 4 }}>
                {t('wirdPlanner.totalPagesRead')}: {stats.totalPagesRead}
              </Text>

              <TouchableOpacity
                testID="wird-reset-khatmah-button"
                onPress={onResetKhatmah}
                style={{ marginTop: 14, alignSelf: 'flex-start' }}
              >
                <Text style={{ ...textStyles.bodySmall, color: colors.warningAccent }}>
                  {t('wirdPlanner.resetKhatmah')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
