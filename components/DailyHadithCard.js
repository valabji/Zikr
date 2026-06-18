import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, arabicContentStyle, getDirectionalMixedSpacing } from '../locales/i18n';
import { getDailyHadith } from '../utils/DailyHadith';

export default function DailyHadithCard() {
  const colors = useColors();
  const hadith = useMemo(() => getDailyHadith(), []);
  const [expanded, setExpanded] = useState(false);

  if (!hadith) return null;

  const lang = isRTL() ? 'ar' : 'en';
  const bookName = lang === 'ar' ? hadith.bookNameAr : hadith.bookNameEn;
  const text = lang === 'ar' ? hadith.textAr : (hadith.textEn || hadith.textAr);

  return (
    <TouchableOpacity
      testID="daily-hadith-card"
      activeOpacity={0.85}
      onPress={() => setExpanded((e) => !e)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 10,
        marginTop: 10,
        width: '95%',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name="book-open" size={16} color={colors.accent} />
        <Text style={{
          ...textStyles.bodySmall,
          color: colors.accent,
          ...getDirectionalMixedSpacing({ marginLeft: 6, marginRight: 6 }),
        }}>
          {t('dailyHadith.title')}
        </Text>
        <View style={{ flex: 1 }} />
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </View>
      <Text
        testID="daily-hadith-text"
        style={[
          textStyles.body,
          lang === 'ar' ? { ...arabicContentStyle(), fontSize: 18 } : { textAlign: 'left' },
          { color: colors.text, marginTop: 8 },
        ]}
        numberOfLines={expanded ? undefined : 3}
      >
        {text}
      </Text>
      <Text style={{
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 6,
        textAlign: isRTL() ? 'right' : 'left',
      }}>
        {bookName} #{hadith.n}
      </Text>
    </TouchableOpacity>
  );
}
