import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING } from '@/constants/settingsTokens';
import SettingsSlider from './SettingsSlider';

export default function SettingsSliderField({ label, ...sliderProps }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  return (
    <View>
      <Text style={[textStyles.body, {
        color: colors.text,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md + 2,
        textAlign: getTextAlign('left'),
      }]}>
        {label}
      </Text>
      <SettingsSlider {...sliderProps} />
    </View>
  );
}
