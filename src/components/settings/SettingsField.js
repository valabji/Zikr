import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING } from '@/constants/settingsTokens';

export default function SettingsField({ label, description, children, style, testID }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();

  return (
    <View style={[{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2 }, style]} testID={testID}>
      {label ? (
        <Text style={[textStyles.body, { color: colors.text, textAlign: getTextAlign('left') }]}>
          {label}
        </Text>
      ) : null}
      {description ? (
        <Text style={[textStyles.caption, {
          color: colors.textSecondary,
          marginTop: 2,
          marginBottom: SPACING.sm,
          textAlign: getTextAlign('left'),
        }]}>
          {description}
        </Text>
      ) : (label ? <View style={{ height: SPACING.sm }} /> : null)}
      {children}
    </View>
  );
}
