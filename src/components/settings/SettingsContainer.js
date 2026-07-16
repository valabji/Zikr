import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useColors } from '@/constants/Colors';
import { CONTENT_MAX_WIDTH, SPACING } from '@/constants/settingsTokens';

export default function SettingsContainer({
  children,
  footer,
  scrollRef,
  contentStyle,
  background,
  testID,
  scrollProps = {},
}) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: background ?? colors.background }} testID={testID}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.lg,
          paddingBottom: footer ? 100 : SPACING.xxl,
        }, contentStyle]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}
