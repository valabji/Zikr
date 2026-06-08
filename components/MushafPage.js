import * as React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { isRTL } from '../locales/i18n';
import { textStyles } from '../constants/Fonts';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import {
  SCREEN_WIDTH, mushafFontSizeForWidth, mushafLineHeightFor,
  getLayout, toArabicDigits,
} from '../utils/mushafLayout';
import { qcfFontFamilyForPage } from '../utils/QcfDownloader';
import translationEn from '../assets/quran/data/translation_en.json';
import SurahCartouche from './SurahCartouche';
import { BismillahLine, MushafLine } from './MushafLine';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const ayahKey = (s, a) => `${s}:${a}`;

function PageContent({ page, colors, settings, qcfVersion, playingAyahKey, onAyahPress, onAyahLongPress }) {
  const fontScale = settings.fontScale || 1;
  const customLineSize = !!settings.customLineSize;
  const { width: windowWidth } = useWindowDimensions();
  const mushafFontSize = mushafFontSizeForWidth(windowWidth);
  const mushafLineHeight = mushafLineHeightFor(mushafFontSize);
  const edition = getMushafEdition(settings.mushafEdition);
  const qcfActive = !!qcfVersion;
  const fontFamily = qcfActive ? qcfFontFamilyForPage(qcfVersion, page.page) : FONT_FAMILY;
  const pageLines = getLayout(edition.layoutFile)[page.page - 1];

  // In customLineSize mode we want one continuous text block per run of
  // consecutive text lines, so words flow across line boundaries instead of
  // each Mushaf line wrapping on its own. Non-text items (surah headers,
  // bismillah) break the flow.
  // Exception: in Al-Fatiha the Basmala is verse 1:1 (a regular text line,
  // not a 'bismillah' separator). Keep it as its own block so it doesn't
  // dissolve into the rest of the surah.
  const items = React.useMemo(() => {
    if (!customLineSize) return pageLines.lines;
    const out = [];
    let run = null;
    const flush = () => { if (run) { out.push(run); run = null; } };
    for (const line of pageLines.lines) {
      if (line.type === 'text') {
        const isFatihaBasmala = line.words.some((w) => w.vk === '1:1');
        if (isFatihaBasmala) {
          flush();
          out.push(line);
          continue;
        }
        if (!run) {
          run = { type: 'text', words: line.words.slice() };
        } else {
          for (const w of line.words) run.words.push(w);
        }
      } else {
        flush();
        out.push(line);
      }
    }
    flush();
    return out;
  }, [pageLines, customLineSize]);

  return (
    <>
      {items.map((line, i) => {
        if (line.type === 'surah_header') {
          return <SurahCartouche key={`l${i}`} surahId={line.surahId} colors={colors} fontScale={fontScale} />;
        }
        if (line.type === 'bismillah') {
          return <BismillahLine key={`l${i}`} colors={colors} fontScale={fontScale} />;
        }
        return (
          <MushafLine
            key={`l${i}`}
            line={line}
            fontFamily={fontFamily}
            qcfActive={qcfActive}
            colors={colors}
            fontScale={fontScale}
            mushafFontSize={mushafFontSize}
            mushafLineHeight={mushafLineHeight}
            playingAyahKey={playingAyahKey}
            onAyahPress={onAyahPress}
            onAyahLongPress={onAyahLongPress}
            customLineSize={customLineSize}
          />
        );
      })}
      {settings.showTranslation ? (
        <View style={{
          marginTop: 14,
          marginHorizontal: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.accent + '22',
        }}>
          {page.ayahs.map((a) => {
            const k = ayahKey(a.surah, a.ayah);
            const tr = translationEn[k];
            if (!tr) return null;
            return (
              <Text
                key={`tr-${k}`}
                style={[textStyles.base, {
                  color: colors.textSecondary,
                  fontSize: 14 * fontScale,
                  lineHeight: 22 * fontScale,
                  marginBottom: 8,
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }]}
              >
                <Text style={{ color: colors.accent, fontWeight: '600' }}>
                  {a.surah}:{a.ayah}{'  '}
                </Text>
                {tr}
              </Text>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

function PageFooter({ page, colors }) {
  const lang = isRTL() ? 'ar' : 'en';
  return (
    <View style={{ paddingVertical: 6, alignItems: 'center' }}>
      <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 11 }]}>
        {lang === 'ar' ? toArabicDigits(page.page) : page.page}
      </Text>
    </View>
  );
}

export function PageView(props) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <PageContent {...props} />
      </ScrollView>
      <PageFooter page={props.page} colors={props.colors} />
    </View>
  );
}

export function PageViewContinuous(props) {
  return (
    <View style={{
      width: SCREEN_WIDTH,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: props.colors.accent + '22',
    }}>
      <PageContent {...props} />
      <PageFooter page={props.page} colors={props.colors} />
    </View>
  );
}
