import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t } from '@/locales/i18n';
import { SPACING, RADIUS, withAlpha } from '@/constants/settingsTokens';
import { SettingsModalShell, SettingsButton } from './settings';
import { isValidHex } from '@/utils/ThemeManager';

const hexToHsl = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;
  return { h: hue, s, l };
};

const hslToHex = ({ h, s, l }) => {
  const hueToRgb = (p, q, tt) => {
    let x = tt;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }
  return '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};

const ChannelSlider = ({ label, value, onChange, accent }) => (
  <View style={{ marginBottom: SPACING.md }}>
    <Text style={[textStyles.caption, { color: accent.textSecondary }]}>{label}</Text>
    <Slider
      style={{ height: 36 }}
      minimumValue={0}
      maximumValue={1}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor={accent.accent}
      maximumTrackTintColor={withAlpha(accent.accent, 0.3)}
      thumbTintColor={accent.accent}
    />
  </View>
);

export default function ColorPickerModal({ visible, title, color, onDone, onClose }) {
  const colors = useColors();
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 0.5 });
  const [hexInput, setHexInput] = useState('#000000');

  useEffect(() => {
    if (visible && isValidHex(color)) {
      setHsl(hexToHsl(color));
      setHexInput(color.toUpperCase());
    }
  }, [visible, color]);

  const current = hslToHex(hsl);

  const updateChannel = (channel) => (value) => {
    const next = { ...hsl, [channel]: value };
    setHsl(next);
    setHexInput(hslToHex(next).toUpperCase());
  };

  const handleHexInput = (value) => {
    const withHash = value.startsWith('#') ? value : `#${value}`;
    setHexInput(withHash.toUpperCase());
    if (isValidHex(withHash)) setHsl(hexToHsl(withHash));
  };

  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={title}
      testID="color-picker-modal"
      footer={(
        <View style={{ flexDirection: 'row', padding: SPACING.lg, gap: SPACING.md }}>
          <SettingsButton label={t('common.cancel')} variant="outline" onPress={onClose} fullWidth style={{ flex: 1 }} />
          <SettingsButton
            testID="color-picker-done"
            label={t('common.ok')}
            onPress={() => onDone(current)}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      )}
    >
      <View style={{ padding: SPACING.lg }}>
        <View
          testID="color-picker-preview"
          style={{
            height: 64,
            borderRadius: RADIUS.control,
            backgroundColor: current,
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 'border'),
            marginBottom: SPACING.lg,
          }}
        />
        <ChannelSlider label={t('themeManager.hue')} value={hsl.h} onChange={updateChannel('h')} accent={colors} />
        <ChannelSlider label={t('themeManager.saturation')} value={hsl.s} onChange={updateChannel('s')} accent={colors} />
        <ChannelSlider label={t('themeManager.lightness')} value={hsl.l} onChange={updateChannel('l')} accent={colors} />
        <TextInput
          testID="color-picker-hex"
          value={hexInput}
          onChangeText={handleHexInput}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          style={[textStyles.body, {
            color: colors.text,
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 'border'),
            borderRadius: RADIUS.control,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            textAlign: 'center',
          }]}
        />
      </View>
    </SettingsModalShell>
  );
}
