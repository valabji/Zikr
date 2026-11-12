import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, DANGER, withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsRow({
  label,
  description,
  value,
  trailing,
  icon,
  onPress,
  chevron,
  testID,
  disabled,
  destructive,
  labelStyle,
}) {
  const colors = useColors();
  const { getTextAlign, isRTL, getDirectionalMixedSpacing } = useRTL();
  const labelColor = destructive ? DANGER : colors.text;
  const iconColor = destructive ? DANGER : colors.accent;

  const body = (
    <View style={[{ flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md + 2,
      opacity: disabled ? 0.5 : 1,
    }]}>
      {icon ? (
        <Feather
          name={icon}
          size={20}
          color={iconColor}
          style={getDirectionalMixedSpacing({ marginRight: SPACING.md })}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.body, { color: labelColor, textAlign: getTextAlign('left') }, labelStyle]}>
          {label}
        </Text>
        {description ? (
          <Text style={[textStyles.caption, {
            color: colors.textSecondary,
            marginTop: 2,
            textAlign: getTextAlign('left'),
          }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {value != null ? (
        <Text
          numberOfLines={1}
          style={[textStyles.bodySmall, {
            color: colors.textSecondary,
            ...getDirectionalMixedSpacing({ marginLeft: SPACING.sm }),
            maxWidth: '45%',
          }]}
        >
          {value}
        </Text>
      ) : null}
      {trailing ? <View style={getDirectionalMixedSpacing({ marginLeft: SPACING.sm })}>{trailing}</View> : null}
      {chevron ? (
        <Feather
          name={isRTL ? 'chevron-left' : 'chevron-right'}
          size={20}
          color={colors.textSecondary}
          style={getDirectionalMixedSpacing({ marginLeft: SPACING.xs })}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View testID={testID}>{body}</View>;
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        { backgroundColor: pressed ? withAlpha(colors.accent, 'activeRow') : hovered ? withAlpha(colors.accent, 'subtle') : 'transparent' },
        webCursor,
      ]}
    >
      {body}
    </Pressable>
  );
}
