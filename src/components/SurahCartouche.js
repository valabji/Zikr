import * as React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  SURA_BORDER_PATH_D,
  SURA_BORDER_VIEWBOX_W,
  SURA_BORDER_VIEWBOX_H,
  SURA_BORDER_VIEWBOX_MIN_Y,
} from '@/constants/SuraBorderSvg';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { SCREEN_WIDTH } from '@/utils/mushafLayout';
import { toArabicDigits } from '@/locales/i18n';
import surahsData from '@assets/quran/data/surahs.json';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

function surahNameGlyph(surahId) {
  // Sura Names V1 font: each surah maps to a PUA codepoint where the last
  // 3 hex digits are the surah number written in decimal — surah 12 -> 0xE012,
  // surah 100 -> 0xE100, surah 114 -> 0xE114.
  const code = 0xE000 + parseInt(String(surahId).padStart(3, '0'), 16);
  return String.fromCodePoint(code);
}

const SURA_BORDER_ASPECT = SURA_BORDER_VIEWBOX_W / SURA_BORDER_VIEWBOX_H;

export default function SurahCartouche({ surahId, colors, fontScale }) {
  const surah = surahById[surahId];
  const ayahCountStr = toArabicDigits(surah.ayahCount);
  const placeAr = surah.type === 'meccan' ? 'مكية' : 'مدنية';

  const [containerWidth, setContainerWidth] = React.useState(SCREEN_WIDTH - 36);
  const borderHeight = containerWidth / SURA_BORDER_ASPECT;

  // Convert SVG-unit font size to screen pixels: SVG_H * 0.55 * scale * (px / SVG_W) = borderHeight * 0.55 * scale
  const nameFontSize = borderHeight * 0.55 * fontScale;

  // Medallion centers in screen px (pixel-density scan: 20.8% / 79.3% of width).
  const medallionBoxWidth = containerWidth * 0.08;
  const leftMedPx = containerWidth * 0.208;
  const rightMedPx = containerWidth * 0.793;
  const medallionFontSize = Math.max(7, Math.min(borderHeight * 0.28, 11));

  return (
    <View
      style={{ marginVertical: 8, marginHorizontal: 18 }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      <Svg
        width={containerWidth}
        height={borderHeight}
        viewBox={`0 ${SURA_BORDER_VIEWBOX_MIN_Y} ${SURA_BORDER_VIEWBOX_W} ${SURA_BORDER_VIEWBOX_H}`}
      >
        <Path fill={colors.accent} d={SURA_BORDER_PATH_D} />
      </Svg>
      {/* Surah name — RN overlay; react-native-svg textAnchor is unreliable with PUA fonts on Android */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: 0, right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            fontFamily: 'KFGQPC_SurahNames',
            fontSize: nameFontSize,
            color: colors.text,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {surahNameGlyph(surahId)}
        </Text>
      </View>
      {/* Mecca/Medina label */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: rightMedPx - medallionBoxWidth / 2,
          width: medallionBoxWidth,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: medallionFontSize,
            color: colors.text,
            textAlign: 'center',
            writingDirection: 'rtl',
            includeFontPadding: false,
          }}
        >
          {placeAr}
        </Text>
      </View>
      {/* Ayah count label */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: leftMedPx - medallionBoxWidth / 2,
          width: medallionBoxWidth,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: 'Cairo_400Regular',
            fontSize: medallionFontSize,
            color: colors.text,
            textAlign: 'center',
            writingDirection: 'rtl',
            includeFontPadding: false,
          }}
        >
          {ayahCountStr}
        </Text>
      </View>
    </View>
  );
}
