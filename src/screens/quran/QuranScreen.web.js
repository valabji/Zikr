import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useColors } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import { loadLayouts } from '@/utils/quran/layoutData';

const Screen = lazy(async () => {
  const [screen] = await Promise.all([import('./QuranScreen.js'), loadLayouts()]);
  return screen;
});

export default function QuranScreen(props) {
  const colors = useColors();
  return (
    <Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} accessibilityLabel={t('quran.loading')} />
      </View>
    }>
      <Screen {...props} />
    </Suspense>
  );
}
