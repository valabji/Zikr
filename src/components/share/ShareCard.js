import * as React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/constants/Colors';
import { textStyles, FONT_FAMILY } from '@/constants/Fonts';
import { cleanForHafs } from '@/utils/quran/mushafText';
import { t } from '@/locales/i18n';

const ShareCard = React.forwardRef(function ShareCard({ content }, ref) {
  const colors = useColors();
  const { arabic, arabicSegments, quran, translation, reference, description } = content || {};

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: 360,
        backgroundColor: colors.background,
        borderWidth: 2,
        borderColor: colors.accent,
        borderRadius: 18,
        padding: 24,
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 24,
          lineHeight: 44,
          color: colors.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {arabicSegments && arabicSegments.length
          ? arabicSegments.map((s, i) => (
              <Text key={i} style={{ fontFamily: s.fontFamily }}>{s.text}</Text>
            ))
          : arabic}
      </Text>
      {quran ? (
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Hafs',
            fontSize: 22,
            lineHeight: 40,
            color: colors.text,
            textAlign: 'center',
            writingDirection: 'rtl',
            marginTop: 14,
          }}
        >
          {cleanForHafs(quran)}
        </Text>
      ) : null}
      {translation ? (
        <Text
          style={[textStyles.base, {
            color: colors.textSecondary,
            fontSize: 15,
            lineHeight: 22,
            textAlign: 'left',
            writingDirection: 'ltr',
            marginTop: 14,
          }]}
        >
          {translation}
        </Text>
      ) : null}
      {description ? (
        <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 10, textAlign: 'center' }]}>
          {description}
        </Text>
      ) : null}
      <View style={{ height: 1, backgroundColor: colors.accent + '33', marginVertical: 16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[textStyles.bodySmall, { color: colors.accent, fontSize: 12 }]}>
          {reference || ''}
        </Text>
        <Text style={[textStyles.bodySmall, { color: colors.accent, fontSize: 12, fontWeight: 'bold' }]}>
          {t('share.cardBranding')}
        </Text>
      </View>
    </View>
  );
});

export default ShareCard;
