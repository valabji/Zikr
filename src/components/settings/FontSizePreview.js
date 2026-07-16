import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, withAlpha } from '@/constants/settingsTokens';
import { t } from '@/locales/i18n';
import { getAzkar } from '@/utils/AzkarStore';

export default function FontSizePreview({ size }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  return (
    <View style={{
      marginTop: SPACING.md,
      padding: SPACING.md,
      backgroundColor: withAlpha(colors.accent, 'subtle'),
      borderRadius: RADIUS.control,
    }}>
      <Text style={[textStyles.caption, {
        color: colors.textSecondary,
        marginBottom: SPACING.xs,
        textAlign: getTextAlign('left'),
      }]}>
        {t('settings.preview')}
      </Text>
      <Text style={[textStyles.base, {
        color: colors.text,
        fontSize: Math.round(size),
        textAlign: getTextAlign('left'),
      }]}>
        {getAzkar()[0]?.zekr || 'الحمد لله وحده، والصلاة والسلام على من لا نبي بعده'}
      </Text>
    </View>
  );
}
