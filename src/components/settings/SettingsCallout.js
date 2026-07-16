import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, DANGER, withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsCallout({ tone = 'info', title, body, icon, onPress, action, testID }) {
  const colors = useColors();
  const { isRTL, getTextAlign } = useRTL();

  const tones = {
    info: { accent: colors.noticeAccent, bg: colors.noticeBackground, text: colors.noticeText, icon: 'info' },
    warning: { accent: colors.warningAccent, bg: colors.warningBackground, text: colors.warningText, icon: 'alert-triangle' },
    danger: { accent: DANGER, bg: withAlpha(DANGER, 0.12), text: colors.text, icon: 'alert-octagon' },
  };
  const tn = tones[tone] || tones.info;
  const iconName = icon || tn.icon;

  // Native swaps left/right borders in RTL; web needs the manual flip
  const accentSide = Platform.OS === 'web' && isRTL
    ? { borderRightWidth: 4, borderRightColor: tn.accent }
    : { borderLeftWidth: 4, borderLeftColor: tn.accent };

  const inner = (
    <View style={{
      flexDirection: 'row',
      backgroundColor: tn.bg,
      borderRadius: RADIUS.control,
      ...accentSide,
      padding: SPACING.md,
      alignItems: 'flex-start',
    }}>
      {iconName ? (
        <Feather name={iconName} size={20} color={tn.accent} style={{ marginHorizontal: SPACING.sm, marginTop: 1 }} />
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={[textStyles.bodySmall, {
            color: tn.text,
            fontWeight: '600',
            marginBottom: body ? 2 : 0,
            textAlign: getTextAlign('left'),
          }]}>
            {title}
          </Text>
        ) : null}
        {body ? (
          <Text style={[textStyles.caption, { color: tn.text, opacity: 0.9, textAlign: getTextAlign('left') }]}>
            {body}
          </Text>
        ) : null}
        {action}
      </View>
    </View>
  );

  if (!onPress) return <View testID={testID}>{inner}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }) => [webCursor, { opacity: pressed ? 0.7 : hovered ? 0.9 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}
