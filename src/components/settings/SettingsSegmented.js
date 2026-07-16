import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { RADIUS, withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsSegmented({ value, options, onChange, testID, getTestID, wrap = false }) {
  const colors = useColors();

  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row',
        backgroundColor: withAlpha(colors.accent, 'subtle'),
        borderRadius: RADIUS.pill,
        padding: 4,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: wrap ? 6 : 0,
        justifyContent: wrap ? 'space-between' : 'flex-start',
      }]}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            testID={getTestID ? getTestID(opt) : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={!opt.label ? (opt.a11yLabel || opt.id) : undefined}
            onPress={() => onChange(opt.id)}
            style={({ hovered, pressed }) => [{ flexDirection: 'row',
              flex: wrap ? undefined : 1,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: RADIUS.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active
                ? colors.accent
                : pressed ? withAlpha(colors.accent, 'activeRow')
                : hovered ? withAlpha(colors.accent, 'subtle') : 'transparent',
            }, webCursor]}
          >
            {opt.icon ? (
              <Feather
                name={opt.icon}
                size={16}
                color={active ? colors.primary : colors.textSecondary}
                style={{ marginHorizontal: opt.label ? 4 : 0 }}
              />
            ) : null}
            {opt.label ? (
              <Text
                numberOfLines={1}
                style={[textStyles.bodySmall, {
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: active ? '600' : '400',
                }]}
              >
                {opt.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
