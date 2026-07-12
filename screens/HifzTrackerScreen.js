import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import CHeader from '../components/CHeader';
import { useColors, getItemColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing } from '../locales/i18n';
import { HIFZ_CONSTANTS } from '../constants/HifzConstants';
import {
  useHifzTracker,
  getSurahEntry,
  isDueForReview,
  setSurahStatus,
  markSurahReviewed,
} from '../utils/HifzTracker';
import surahsData from '../assets/quran/data/surahs.json';
import { SettingsSegmented } from '../components/settings';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, webCursor } from '../constants/settingsTokens';

const { STATUS } = HIFZ_CONSTANTS;
const NEXT_STATUS = {
  [STATUS.NOT_STARTED]: STATUS.IN_PROGRESS,
  [STATUS.IN_PROGRESS]: STATUS.MEMORIZED,
  [STATUS.MEMORIZED]: STATUS.NOT_STARTED,
};

const FILTERS = ['all', 'memorized', 'inProgress', 'due'];

function StatusIcon({ status, colors, fg }) {
  if (status === STATUS.MEMORIZED) return <Feather name="check-circle" size={22} color={colors.currentPrayer} />;
  if (status === STATUS.IN_PROGRESS) return <Feather name="edit-3" size={22} color={fg || colors.accent} />;
  return <Feather name="circle" size={22} color={fg || colors.textSecondary} />;
}

function SurahRow({ surah, entry, due, colors, lang }) {
  const name = lang === 'ar' ? surah.nameAr : surah.nameEn;
  const g = getItemColors(colors, surah.id - 1);

  const onCycleStatus = useCallback(() => {
    setSurahStatus(surah.id, NEXT_STATUS[entry.status]);
  }, [surah.id, entry.status]);

  const onReview = useCallback(() => {
    markSurahReviewed(surah.id);
  }, [surah.id]);

  return (
    <View
      testID={`hifz-row-${surah.id}`}
      style={{
        backgroundColor: g ? 'transparent' : colors.surface,
        borderRadius: RADIUS.card,
        padding: SPACING.md + 2,
        marginBottom: SPACING.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
      <TouchableOpacity testID={`hifz-status-${surah.id}`} onPress={onCycleStatus} accessibilityRole="button" accessibilityLabel={name} style={[{ padding: SPACING.xs }, webCursor]}>
        <StatusIcon status={entry.status} colors={colors} fg={g ? g.fg : null} />
      </TouchableOpacity>

      <View style={{ flex: 1, ...getDirectionalMixedSpacing({ marginLeft: 12, marginRight: 12 }) }}>
        <Text style={{ ...textStyles.body, color: g ? g.fg : colors.text }}>{name}</Text>
        <Text style={{ ...textStyles.caption, color: g ? g.fg : colors.textSecondary, marginTop: 2, opacity: g ? 0.85 : 1 }}>
          {t('hifz.ayahCount', { count: surah.ayahCount })}
        </Text>
      </View>

      {due && (
        <TouchableOpacity
          testID={`hifz-review-${surah.id}`}
          onPress={onReview}
          accessibilityRole="button"
          accessibilityLabel={t('hifz.review')}
          style={[{
            backgroundColor: colors.warningAccent,
            borderRadius: RADIUS.control,
            paddingVertical: 6,
            paddingHorizontal: SPACING.sm + 2,
            flexDirection: 'row',
            alignItems: 'center',
          }, webCursor]}
        >
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={{ ...textStyles.caption, color: colors.primary, ...getDirectionalMixedSpacing({ marginLeft: 4, marginRight: 4 }) }}>
            {t('hifz.review')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HifzTrackerScreen({ navigation }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const lang = isRTL() ? 'ar' : 'en';
  const { state, stats } = useHifzTracker();
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    return surahsData
      .map((surah) => {
        const entry = getSurahEntry(state, surah.id);
        const due = isDueForReview(entry);
        return { surah, entry, due };
      })
      .filter(({ entry, due }) => {
        if (filter === 'memorized') return entry.status === STATUS.MEMORIZED;
        if (filter === 'inProgress') return entry.status === STATUS.IN_PROGRESS;
        if (filter === 'due') return due;
        return true;
      });
  }, [state, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="hifz-tracker-screen">
      <CHeader navigation={navigation} isHome={true} title={t('hifz.title')} />

      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: RADIUS.card, padding: SPACING.lg }}>
            <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 8 }}>
              {t('hifz.progress')}
            </Text>
            <Text style={{ ...textStyles.body, color: colors.accent }}>
              {t('hifz.surahsMemorized', { count: stats.memorizedCount, total: HIFZ_CONSTANTS.TOTAL_SURAHS })}
            </Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden', marginTop: 8 }}>
              <View style={{
                height: 8,
                width: `${Math.min(100, stats.percentMemorized)}%`,
                backgroundColor: colors.currentPrayer,
                borderRadius: 4,
              }} />
            </View>
            <Text style={{ ...textStyles.caption, color: colors.textSecondary, marginTop: 8 }}>
              {t('hifz.ayahProgress', { progress: stats.totalAyahMemorized, total: stats.totalAyahCount })}
            </Text>
            {stats.dueReviewCount > 0 && (
              <Text style={{ ...textStyles.bodySmall, color: colors.warningAccent, marginTop: 8 }}>
                {t('hifz.dueForReview', { count: stats.dueReviewCount })}
              </Text>
            )}
          </View>

          <View style={{ marginTop: SPACING.md }}>
            <SettingsSegmented
              value={filter}
              options={FILTERS.map((f) => ({ id: f, label: t(`hifz.filters.${f}`) }))}
              onChange={setFilter}
              getTestID={(opt) => `hifz-filter-${opt.id}`}
            />
          </View>
        </View>
      </View>

      <FlatList
        testID="hifz-surah-list"
        data={rows}
        keyExtractor={({ surah }) => String(surah.id)}
        contentContainerStyle={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: SPACING.lg, paddingBottom: insets.bottom + SPACING.xxl }}
        renderItem={({ item }) => (
          <SurahRow surah={item.surah} entry={item.entry} due={item.due} colors={colors} lang={lang} />
        )}
        ListEmptyComponent={
          <Text style={{ ...textStyles.body, color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
            {t('hifz.noResults')}
          </Text>
        }
      />
    </View>
  );
}
