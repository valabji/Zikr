import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors, getItemColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, arabicContentStyle, getDirectionalMixedSpacing } from '@/locales/i18n';
import { getDailyHadith } from '@/utils/books/DailyHadith';

export default function DailyHadithCard() {
  const colors = useColors();
  const hadith = useMemo(() => getDailyHadith(), []);
  const [expanded, setExpanded] = useState(false);

  if (!hadith) return null;

  const lang = isRTL() ? 'ar' : 'en';
  const bookName = lang === 'ar' ? hadith.bookNameAr : hadith.bookNameEn;
  const text = lang === 'ar' ? hadith.textAr : (hadith.textEn || hadith.textAr);
  const g = getItemColors(colors, 4);

  return (
    <TouchableOpacity
      testID="daily-hadith-card"
      activeOpacity={0.85}
      onPress={() => setExpanded((e) => !e)}
      style={{
        backgroundColor: g ? 'transparent' : colors.surface,
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 10,
        marginTop: 10,
        width: '95%',
        overflow: 'hidden',
      }}
    >
      {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name="book-open" size={16} color={g ? g.fg : colors.accent} />
        <Text style={{
          ...textStyles.bodySmall,
          color: g ? g.fg : colors.accent,
          ...getDirectionalMixedSpacing({ marginLeft: 6, marginRight: 6 }),
        }}>
          {t('dailyHadith.title')}
        </Text>
        <View style={{ flex: 1 }} />
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={g ? g.fg : colors.textSecondary} />
      </View>
      <Text
        testID="daily-hadith-text"
        style={[
          textStyles.body,
          lang === 'ar' ? { ...arabicContentStyle(), fontSize: 18 } : { textAlign: 'left' },
          { color: g ? g.fg : colors.text, marginTop: 8 },
        ]}
        numberOfLines={expanded ? undefined : 3}
      >
        {text}
      </Text>
      <Text style={{
        ...textStyles.caption,
        color: g ? g.fg : colors.textSecondary,
        marginTop: 6,
        opacity: g ? 0.85 : 1,
        textAlign: isRTL() ? 'right' : 'left',
      }}>
        {bookName} #{hadith.n}
      </Text>
    </TouchableOpacity>
  );
}
