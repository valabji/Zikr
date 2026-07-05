import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { arabicContentStyle } from '../locales/i18n';

export default function BookEntry({ item, index, colors, fontScale, showTranslation, bookmarked, onToggleBookmark, fmtNum }) {
  const hasAr = !!item.textAr;
  const hasEn = !!item.textEn;
  const showEn = hasEn && (showTranslation || !hasAr);
  return (
    <View style={{ direction: hasAr ? 'rtl' : 'ltr' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{
          minWidth: 34, height: 34, borderRadius: 17, paddingHorizontal: 8,
          backgroundColor: colors.accent + '22',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{fmtNum(item.n)}</Text>
        </View>
        {onToggleBookmark ? (
          <TouchableOpacity
            testID={`book-bookmark-${index}`}
            onPress={() => onToggleBookmark(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {hasAr ? (
        <Text style={arabicContentStyle({ fontFamily: FONT_FAMILY, fontSize: 20 * fontScale, lineHeight: 38 * fontScale, color: colors.text })}>
          {item.textAr}
        </Text>
      ) : null}
      {showEn ? (
        <Text style={[textStyles.base, {
          color: hasAr ? colors.textSecondary : colors.text,
          fontSize: (hasAr ? 15 : 18) * fontScale,
          lineHeight: (hasAr ? 24 : 30) * fontScale,
          marginTop: hasAr ? 12 : 0,
          textAlign: 'left',
          writingDirection: 'ltr',
        }]}>
          {item.textEn}
        </Text>
      ) : null}
    </View>
  );
}
