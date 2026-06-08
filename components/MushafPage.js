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
  const { width: windowWidth } = useWindowDimensions();
  const mushafFontSize = mushafFontSizeForWidth(windowWidth);
  const mushafLineHeight = mushafLineHeightFor(mushafFontSize);
  const edition = getMushafEdition(settings.mushafEdition);
  const qcfActive = !!qcfVersion;
  const fontFamily = qcfActive ? qcfFontFamilyForPage(qcfVersion, page.page) : FONT_FAMILY;
  const pageLines = getLayout(edition.layoutFile)[page.page - 1];

  return (
    <>
      {pageLines.lines.map((line, i) => {
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
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
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
