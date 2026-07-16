import React, { useRef, useEffect } from 'react';
import { Animated, Pressable } from 'react-native';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { withAlpha, webCursor } from '@/constants/settingsTokens';

export default function SettingsToggle({ value, onValueChange, disabled, testID, size = 28 }) {
  const colors = useColors();
  const { isRTL } = useRTL();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackW = size * 1.8;
  const trackH = size;
  const pad = 4;
  const thumb = size - pad * 2;
  const travel = trackW - thumb - pad * 2;

  // translateX is physical on every platform; the row is visually mirrored in RTL so travel is negated
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isRTL ? -travel : travel],
  });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [withAlpha(colors.textSecondary, 0.35), colors.accent],
  });

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      style={webCursor}
    >
      <Animated.View style={{
        width: trackW,
        height: trackH,
        borderRadius: trackH / 2,
        backgroundColor: trackColor,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: pad,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
      }}>
        <Animated.View style={{
          width: thumb,
          height: thumb,
          borderRadius: thumb / 2,
          backgroundColor: colors.primary,
          transform: [{ translateX }],
        }} />
      </Animated.View>
    </Pressable>
  );
}
