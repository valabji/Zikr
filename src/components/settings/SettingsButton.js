import React from 'react';
import { Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, DANGER, withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  testID,
  fullWidth,
  style,
}) {
  const colors = useColors();

  const palettes = {
    primary: { bg: colors.accent, fg: colors.primary, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.accent, border: colors.accent },
    text: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
    destructive: { bg: withAlpha(DANGER, 0.14), fg: DANGER, border: 'transparent' },
  };
  const p = palettes[variant] || palettes.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [{ flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.control,
        backgroundColor: p.bg,
        borderWidth: p.border === 'transparent' ? 0 : 1,
        borderColor: p.border,
        opacity: disabled ? 0.5 : pressed ? 0.7 : hovered ? 0.88 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      }, webCursor, style]}
    >
      {icon ? (
        <Feather name={icon} size={18} color={p.fg} style={{ marginHorizontal: label ? 6 : 0 }} />
      ) : null}
      {label ? (
        <Text style={[textStyles.bodySmall, { color: p.fg, fontWeight: '600' }]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}
