import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, withAlpha } from '@/constants/settingsTokens';

export default function SettingsSlider({
  value,
  min,
  max,
  step,
  onChange,
  onSlidingComplete,
  format,
  preview,
  minLabel,
  maxLabel,
  testID,
}) {
  const colors = useColors();
  const { isRTL, getDirectionalMixedSpacing } = useRTL();
  const [draft, setDraft] = useState(null);
  const display = draft != null ? draft : value;

  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2 }} testID={testID}>
      <View style={[{ flexDirection: 'row', alignItems: 'center' }]}>
        {minLabel ? (
          <Text style={[textStyles.caption, { color: colors.textSecondary, ...getDirectionalMixedSpacing({ marginRight: SPACING.sm }) }]}>{minLabel}</Text>
        ) : null}
        <Slider
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: display }}
          style={{ flex: 1, height: 40 }}
          inverted={Platform.OS === 'web' && isRTL}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={(v) => { setDraft(v); onChange && onChange(v); }}
          onSlidingComplete={(v) => { setDraft(null); onSlidingComplete && onSlidingComplete(v); }}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={withAlpha(colors.accent, 0.3)}
          thumbTintColor={colors.accent}
        />
        {maxLabel ? (
          <Text style={[textStyles.caption, { color: colors.textSecondary, ...getDirectionalMixedSpacing({ marginLeft: SPACING.sm }) }]}>{maxLabel}</Text>
        ) : null}
        {format ? (
          <Text style={[textStyles.bodySmall, {
            color: colors.textSecondary,
            minWidth: 52,
            textAlign: 'center',
            ...getDirectionalMixedSpacing({ marginLeft: SPACING.sm }),
          }]}>
            {format(display)}
          </Text>
        ) : null}
      </View>
      {preview ? preview(display) : null}
    </View>
  );
}
