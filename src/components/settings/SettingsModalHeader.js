import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import { textStyles } from '@/constants/Fonts';
import { SPACING, withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsModalHeader({ title, onClose, closeIcon = 'x', testID }) {
  const colors = useColors();
  const BTN = 42;

  return (
    <View style={[{ flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: withAlpha(colors.accent, 'hairline'),
    }]}>
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={[{ width: BTN, height: BTN, alignItems: 'center', justifyContent: 'center' }, webCursor]} hitSlop={6}>
        <Feather name={closeIcon} size={24} color={colors.text} />
      </Pressable>
      <Text
        numberOfLines={1}
        style={[textStyles.header, { color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: SPACING.sm }]}
      >
        {title}
      </Text>
      <View style={{ width: BTN }} />
    </View>
  );
}
