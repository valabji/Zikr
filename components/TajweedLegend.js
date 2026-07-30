import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors, useIsBrightTheme } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t } from '../locales/i18n';
import { TAJWEED_LEGEND } from '../constants/QuranConstants';
import { withAlpha } from '../constants/settingsTokens';

export default function TajweedLegend({ mode = 'compact', onToggle = null }) {
  const colors = useColors();
  const bright = useIsBrightTheme();

  const borderStyle = { borderTopWidth: 1, borderTopColor: withAlpha(colors.accent, 'border') };

  const Swatch = ({ entry }) => (
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: bright ? entry.light : entry.dark, marginEnd: 5 }} />
  );

  if (mode === 'full') {
    return (
      <View testID="tajweed-legend" style={[borderStyle, { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 }]}>
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          {TAJWEED_LEGEND.map((entry) => (
            <View key={entry.id} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', paddingEnd: 8, marginBottom: 6 }}>
              <Swatch entry={entry} />
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{t(entry.labelKey)}</Text>
            </View>
          ))}
        </View>
        {onToggle ? (
          <TouchableOpacity
            testID="tajweed-legend-toggle"
            onPress={onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingStart: 8, paddingTop: 2 }}
          >
            <Feather name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View
      testID="tajweed-legend"
      style={[borderStyle, { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8 }]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 4 }}>
        {TAJWEED_LEGEND.map((entry) => (
          <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', marginEnd: 14 }}>
            <Swatch entry={entry} />
            <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{t(entry.labelKey)}</Text>
          </View>
        ))}
      </ScrollView>
      {onToggle ? (
        <TouchableOpacity
          testID="tajweed-legend-toggle"
          onPress={onToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingStart: 8 }}
        >
          <Feather name="chevron-up" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
