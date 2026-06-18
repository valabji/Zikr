import * as React from 'react';
import { View, Text } from 'react-native';
import { QURAN_CONSTANTS, CUSTOM_LINE_BASE_FONT_SIZE } from '../constants/QuranConstants';
import { toArabicDigits, arForHafs } from '../utils/mushafLayout';
import wordsData from '../assets/quran/data/words.json';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const MISTAKE_HIGHLIGHT = '#E53935';

// playingWordIdx counts speakable words across the whole ayah; when an ayah
// spans multiple lines its words are split across MushafLine instances, so a
// per-line counter alone restarts at 0 each line. Anchor to the ayah by
// finding where this line's slice begins inside the full ayah word list.
function ayahWordBase(vk, lineSpeakable) {
  const full = wordsData[vk];
  if (!full || !full.length || !lineSpeakable.length) return 0;
  for (let i = 0; i <= full.length - lineSpeakable.length; i += 1) {
    let match = true;
    for (let j = 0; j < lineSpeakable.length; j += 1) {
      if (full[i + j].ar !== lineSpeakable[j].ar) { match = false; break; }
    }
    if (match) return i;
  }
  return 0;
}

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
  mushafFontSize, mushafLineHeight, mushafSpaceExtra, playingAyahKey, playingWordIdx,
  playingWordMistake, onAyahPress, onAyahLongPress, customLineSize,
  wordTooltipEnabled, onWordPress,
}) {
  // Justification: letterSpacing on the lone space char widens only the
  // inter-word gaps, leaving word glyphs and Arabic joining untouched.
  const spaceExtra = (!customLineSize && mushafSpaceExtra > 0) ? mushafSpaceExtra : 0;
  const sep = spaceExtra > 0 ? <Text style={{ letterSpacing: spaceExtra }}> </Text> : ' ';
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
  // In customLineSize mode we abandon the Mushaf width-fit and let lines wrap
  // so the user can crank the font slider past what one printed line allows.
  const fontSize = customLineSize
    ? CUSTOM_LINE_BASE_FONT_SIZE * fontScale
    : mushafFontSize * fontScale;
  const lineHeight = customLineSize
    ? Math.round(fontSize * 1.5)
    : mushafLineHeight * fontScale;

  return (
    <View style={{ paddingHorizontal: 8, marginVertical: 1 }}>
      <Text
        allowFontScaling={false}
        numberOfLines={customLineSize ? undefined : 1}
        ellipsizeMode="tail"
        style={{
          fontFamily,
          fontSize,
          lineHeight,
          color: colors.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {groups.map((g, gi) => {
          const isPlaying = playingAyahKey === g.vk;
          const [s, a] = g.vk.split(':').map(Number);
          const ayahMeta = { surah: s, ayah: a };

          const needsWordIndex = isPlaying || wordTooltipEnabled;
          let speakableIdx = needsWordIndex
            ? ayahWordBase(g.vk, g.words.filter((w) => w.type !== 'end')) - 1
            : -1;
          const ayahWords = wordTooltipEnabled ? wordsData[g.vk] : null;
          const segChildren = g.words.map((w, wi) => {
            if (w.type === 'end' && !qcfActive) {
              return (
                <Text
                  key={wi}
                  style={{ fontFamily: FONT_FAMILY, color: colors.accent }}
                >
                  {sep}{toArabicDigits(a)}
                </Text>
              );
            }
            if (w.type !== 'end') speakableIdx += 1;
            const txt = qcfActive ? (w.code || arForHafs(w.ar)) : arForHafs(w.ar);
            const isWordHighlighted = isPlaying && w.type !== 'end' && playingWordIdx === speakableIdx;
            const highlightColor = (isWordHighlighted && playingWordMistake)
              ? MISTAKE_HIGHLIGHT + '66'
              : colors.accent + '55';
            const wordGloss = ayahWords && w.type !== 'end' ? ayahWords[speakableIdx] : null;
            return (
              <Text
                key={wi}
                testID={wordTooltipEnabled && w.type !== 'end' ? 'mushaf-word' : undefined}
                onPress={wordTooltipEnabled && w.type !== 'end' ? (e) => {
                  onWordPress({ ar: w.ar, en: wordGloss ? wordGloss.en : null }, e.nativeEvent.pageX, e.nativeEvent.pageY);
                } : undefined}
                style={isWordHighlighted ? { backgroundColor: highlightColor } : null}
              >
                {wi === 0 ? '' : sep}{txt}
              </Text>
            );
          });

          return (
            <Text
              key={gi}
              onPress={() => onAyahPress(ayahMeta)}
              onLongPress={() => onAyahLongPress(ayahMeta)}
              style={isPlaying ? { backgroundColor: colors.accent + '33' } : null}
            >
              {gi > 0 ? sep : ''}{segChildren}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}
