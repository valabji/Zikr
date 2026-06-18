import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import CHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
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

const { STATUS } = HIFZ_CONSTANTS;
const NEXT_STATUS = {
  [STATUS.NOT_STARTED]: STATUS.IN_PROGRESS,
  [STATUS.IN_PROGRESS]: STATUS.MEMORIZED,
  [STATUS.MEMORIZED]: STATUS.NOT_STARTED,
};

const FILTERS = ['all', 'memorized', 'inProgress', 'due'];

function StatusIcon({ status, colors }) {
  if (status === STATUS.MEMORIZED) return <Feather name="check-circle" size={22} color={colors.currentPrayer} />;
  if (status === STATUS.IN_PROGRESS) return <Feather name="edit-3" size={22} color={colors.accent} />;
  return <Feather name="circle" size={22} color={colors.textSecondary} />;
}

function SurahRow({ surah, entry, due, colors, lang }) {
  const name = lang === 'ar' ? surah.nameAr : surah.nameEn;

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
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TouchableOpacity testID={`hifz-status-${surah.id}`} onPress={onCycleStatus} style={{ padding: 4 }}>
        <StatusIcon status={entry.status} colors={colors} />
      </TouchableOpacity>

      <View style={{ flex: 1, ...getDirectionalMixedSpacing({ marginLeft: 12, marginRight: 12 }) }}>
        <Text style={{ ...textStyles.body, color: colors.text }}>{name}</Text>
        <Text style={{ ...textStyles.caption, color: colors.textSecondary, marginTop: 2 }}>
          {t('hifz.ayahCount', { count: surah.ayahCount })}
        </Text>
      </View>

      {due && (
        <TouchableOpacity
          testID={`hifz-review-${surah.id}`}
          onPress={onReview}
          style={{
            backgroundColor: colors.warningAccent,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
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

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
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

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              testID={`hifz-filter-${f}`}
              onPress={() => setFilter(f)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: filter === f ? colors.accent : colors.surface,
                marginHorizontal: 3,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...textStyles.caption, color: filter === f ? colors.primary : colors.textSecondary }}>
                {t(`hifz.filters.${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        testID="hifz-surah-list"
        data={rows}
        keyExtractor={({ surah }) => String(surah.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
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
