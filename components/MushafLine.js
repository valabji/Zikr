import * as React from 'react';
import { View, Text } from 'react-native';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';
import { toArabicDigits } from '../utils/mushafLayout';

const { FONT_FAMILY } = QURAN_CONSTANTS;

// KFGQPC Bismillah font: single ornate calligraphic ligature at U+FDFD.
const BISMILLAH_GLYPH = '﷽';

export function BismillahLine({ colors, fontScale }) {
  return (
    <Text
      allowFontScaling={false}
      style={{
        fontFamily: 'KFGQPC_Bismillah',
        fontSize: 36 * fontScale,
        lineHeight: 60 * fontScale,
        color: colors.text,
        textAlign: 'center',
        writingDirection: 'rtl',
        paddingVertical: 4,
        includeFontPadding: false,
      }}
    >
      {BISMILLAH_GLYPH}
    </Text>
  );
}

export function MushafLine({
  line, fontFamily, qcfActive, colors, fontScale,
  mushafFontSize, mushafLineHeight, playingAyahKey,
  onAyahPress, onAyahLongPress,
}) {
  // Group consecutive words by verse_key so each ayah is one pressable Text segment.
  const groups = [];
  for (const w of line.words) {
    const last = groups[groups.length - 1];
    if (!last || last.vk !== w.vk) {
      groups.push({ vk: w.vk, words: [w] });
    } else {
      last.words.push(w);
    }
  }

  // KFGQPC convention: every line on every page uses the same font size.
  // Short lines are centered; line-fit justification belongs to the per-page
  // QCF font glyphs (HD download path), not to runtime font scaling.
  return (
    <View style={{ paddingHorizontal: 8, marginVertical: 1 }}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        ellipsizeMode="clip"
        style={{
          fontFamily,
          fontSize: mushafFontSize * fontScale,
          lineHeight: mushafLineHeight * fontScale,
          color: colors.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {groups.map((g, gi) => {
          const isPlaying = playingAyahKey === g.vk;
          const [s, a] = g.vk.split(':').map(Number);
          const ayahMeta = { surah: s, ayah: a };

          const segChildren = g.words.map((w, wi) => {
            if (w.type === 'end' && !qcfActive) {
              return (
                <Text
                  key={wi}
                  style={{ fontFamily: FONT_FAMILY, color: colors.accent }}
                >
                  {' '}﴿{toArabicDigits(a)}﴾
                </Text>
              );
            }
            const txt = qcfActive ? (w.code || w.ar) : w.ar;
            return (wi === 0 ? '' : ' ') + txt;
          });

          return (
            <Text
              key={gi}
              onPress={() => onAyahPress(ayahMeta)}
              onLongPress={() => onAyahLongPress(ayahMeta)}
              style={isPlaying ? { backgroundColor: colors.accent + '33' } : null}
            >
              {gi > 0 ? ' ' : ''}{segChildren}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}
