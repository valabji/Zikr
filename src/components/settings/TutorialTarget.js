import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/constants/Colors';
import { SPACING, RADIUS } from '@/constants/settingsTokens';

export default function TutorialTarget({ onLayout, highlighted, children }) {
  const colors = useColors();
  return (
    <View onLayout={onLayout} style={{ marginBottom: SPACING.xl }}>
      {children}
      {highlighted ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -3, left: -3, right: -3, bottom: -3,
            borderWidth: 2,
            borderColor: colors.accent,
            borderRadius: RADIUS.card + 3,
          }}
        />
      ) : null}
    </View>
  );
}
