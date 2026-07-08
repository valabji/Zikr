import * as React from 'react';
import { View, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { isRTL } from '../locales/i18n';
import { textStyles } from '../constants/Fonts';
import { useIsBrightTheme } from '../constants/Colors';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import * as Font from 'expo-font';
import {
  SCREEN_WIDTH, mushafFontSizeForWidth, mushafLineHeightFor,
  getLayout, toArabicDigits, arForHafs, getPageProbeLen,
  perLineFontSizesForPage, computeMushafLineSizes, refineMushafLineSizes,
  estimatedLineSizesForPage, justifiedSpaceExtrasForPage,
  PROBE_FONT_SIZE, MUSHAF_HORIZONTAL_PADDING,
  getCachedMushafLineSizes, setCachedMushafLineSizes,
} from '../utils/mushafLayout';
import QcfDownloader, { qcfFontFamilyForPage } from '../utils/QcfDownloader';
import translationEn from '../assets/quran/data/translation_en.json';
import SurahCartouche from './SurahCartouche';
import { BismillahLine, MushafLine } from './MushafLine';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const ayahKey = (s, a) => `${s}:${a}`;

function PageContent({ page, colors, settings, qcfVersion, playingAyahKey, playingWordIdx, playingWordMistake, onAyahPress, onAyahLongPress, onWordPress, onLineOverflow, onQcfLoadError, pageWidth: pageWidthProp }) {
  const customLineSize = !!settings.customLineSize;
  const fontScale = customLineSize ? (settings.fontScale || 1) : 1;
  const { width: windowWidth } = useWindowDimensions();
  const effectiveWidth = pageWidthProp || windowWidth;
  const edition = getMushafEdition(settings.mushafEdition);
  // Only treat QCF as active once this page's font is truly registered, so we
  // never render or measure the codes with a system-fallback font.
  const darkQcf = !useIsBrightTheme();
  const qcfFamily = qcfVersion ? qcfFontFamilyForPage(qcfVersion, page.page, darkQcf) : null;
  const qcfActive = !!qcfFamily && Font.isLoaded(qcfFamily);
  const [, bumpFontTick] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    if (!qcfFamily || qcfActive) return;
    let alive = true;
    QcfDownloader.loadPageFont(qcfVersion, page.page, darkQcf)
      .then(() => { if (alive) bumpFontTick(); })
      .catch(() => { if (alive && onQcfLoadError) onQcfLoadError(); });
    return () => { alive = false; };
  }, [qcfFamily, qcfActive, qcfVersion, page.page, darkQcf]);
  const fontFamily = qcfActive ? qcfFamily : FONT_FAMILY;
  const qcfTable = qcfActive ? (qcfVersion === 'v4' ? 'qcf4' : 'qcf') : null;
  const pageLines = getLayout(edition.layoutFile)[page.page - 1];

  // Auto-fit by measurement, in two probe passes: pass 1 renders every text
  // line hidden at PROBE_FONT_SIZE and scales each measured width to a fit
  // size; pass 2 re-measures at those actual sizes and shrinks any line that
  // still overflows, since font advances don't extrapolate perfectly linearly
  // across sizes. QCF (HD) pages use one uniform size — their per-page glyph
  // metrics already justify every line to the same printed width — while
  // UthmanicHafs lines each fit their own measured width (capped so short
  // surah-ending lines don't balloon). Probe strings replicate MushafLine's
  // output exactly, including spacing around the end-of-verse ayah numbers
  // (bare digits — the Hafs font draws them inside its own ayah ornament).
  const pageIndex = page.page - 1;
  const lineCount = pageLines.lines.length;
  const probeStrings = React.useMemo(() => {
    if (customLineSize) return null;
    let anyText = false;
    const out = pageLines.lines.map((line) => {
      if (line.type !== 'text') return null;
      let s = '';
      let prevVk = null;
      let wordInGroup = 0;
      for (const w of line.words) {
        if (w.vk !== prevVk) {
          if (prevVk != null) s += ' ';
          prevVk = w.vk;
          wordInGroup = 0;
        }
        if (!qcfActive && w.type === 'end') {
          const [, aStr] = (w.vk || ':').split(':');
          s += ' ' + toArabicDigits(Number(aStr));
        } else {
          s += (wordInGroup === 0 ? '' : ' ') + (qcfActive ? (w.code || arForHafs(w.ar)) : arForHafs(w.ar));
        }
        wordInGroup += 1;
      }
      if (s === '') return null;
      anyText = true;
      return s;
    });
    return anyText ? out : null;
  }, [customLineSize, qcfActive, pageLines]);

  const probeLineIdxs = React.useMemo(() => {
    if (!probeStrings) return null;
    const out = [];
    for (let i = 0; i < probeStrings.length; i++) if (probeStrings[i] != null) out.push(i);
    return out;
  }, [probeStrings]);

  const [probeState, setProbeState] = React.useState(() => {
    const cached = getCachedMushafLineSizes(effectiveWidth, fontFamily, edition.layoutFile, pageIndex);
    return cached ? { sizes: cached.sizes, emPx: cached.emPx, refined: true } : { sizes: null, emPx: null, refined: false };
  });
  const [probeAttempt, setProbeAttempt] = React.useState(0);
  const probeWidthsRef = React.useRef({ pass: 1, widths: {} });
  const [fitAdjust, setFitAdjust] = React.useState({});
  const overflowReportedRef = React.useRef(false);

  React.useEffect(() => {
    probeWidthsRef.current = { pass: 1, widths: {} };
    setProbeAttempt(0);
    setFitAdjust({});
    overflowReportedRef.current = false;
    const cached = getCachedMushafLineSizes(effectiveWidth, fontFamily, edition.layoutFile, pageIndex);
    setProbeState(cached ? { sizes: cached.sizes, emPx: cached.emPx, refined: true } : { sizes: null, emPx: null, refined: false });
  }, [effectiveWidth, fontFamily, edition.layoutFile, pageIndex]);

  const probePass = probeState.sizes ? 2 : 1;

  const applyProbeWidths = React.useCallback((pass, widths) => {
    const avail = effectiveWidth - MUSHAF_HORIZONTAL_PADDING;
    if (pass === 1) {
      const sizes = computeMushafLineSizes(widths, probeStrings.length, avail, qcfActive);
      if (!sizes) return;
      const emPx = {};
      for (const k in widths) emPx[k] = widths[k] / PROBE_FONT_SIZE;
      probeWidthsRef.current = { pass: 2, widths: {} };
      setProbeState({ sizes, emPx, refined: false });
    } else {
      const refined = refineMushafLineSizes(probeState.sizes, widths, avail, qcfActive);
      const emPx = {};
      for (const k in widths) emPx[k] = widths[k] / probeState.sizes[k];
      setCachedMushafLineSizes(effectiveWidth, fontFamily, edition.layoutFile, pageIndex, refined, emPx);
      setProbeState({ sizes: refined, emPx, refined: true });
    }
  }, [probeStrings, probeState, qcfActive, effectiveWidth, fontFamily, edition.layoutFile, pageIndex]);

  // Native: one onTextLayout event delivers every line's width atomically, so a
  // single dropped per-line onLayout can no longer strand the page on the estimate.
  const handleProbeTextLayout = React.useCallback((pass, lines) => {
    if (!probeStrings || pass !== probeWidthsRef.current.pass) return;
    if (!lines || lines.length !== probeLineIdxs.length) return;
    const widths = {};
    for (let k = 0; k < lines.length; k++) {
      const w = lines[k].width;
      if (!(w > 0) || w >= 9000) return;
      widths[probeLineIdxs[k]] = w;
    }
    applyProbeWidths(pass, widths);
  }, [probeStrings, probeLineIdxs, applyProbeWidths]);

  // Web: react-native-web has no onTextLayout, so measure line by line.
  const handleProbeLineLayout = React.useCallback((pass, idx, w) => {
    const store = probeWidthsRef.current;
    // A width at the container bound means the Text got stretched, not measured.
    if (pass !== store.pass || !(w > 0) || w >= 9000 || !probeStrings) return;
    if (store.widths[idx] != null) return;
    store.widths[idx] = w;
    for (let i = 0; i < probeStrings.length; i++) {
      if (probeStrings[i] != null && store.widths[i] == null) return;
    }
    applyProbeWidths(pass, store.widths);
  }, [probeStrings, applyProbeWidths]);

  // If a probe event still gets lost, remount the probe (bounded retries).
  React.useEffect(() => {
    if (probeState.refined || !probeStrings || probeAttempt >= 4) return;
    const tm = setTimeout(() => {
      probeWidthsRef.current = { pass: probeState.sizes ? 2 : 1, widths: {} };
      setProbeAttempt((a) => a + 1);
    }, 500 + probeAttempt * 300);
    return () => clearTimeout(tm);
  }, [probeState, probeAttempt, probeStrings]);

  // Build-time width tables give near-exact sizes before the probe lands; the
  // letter-count heuristic remains as a last resort if a table is missing.
  const fallbackSizes = React.useMemo(() => {
    const est = estimatedLineSizesForPage(
      edition.layoutFile, pageIndex, effectiveWidth - MUSHAF_HORIZONTAL_PADDING, qcfTable);
    if (est) return est;
    const pageFit = mushafFontSizeForWidth(effectiveWidth, getPageProbeLen(edition.layoutFile, pageIndex));
    if (qcfActive) return new Array(lineCount).fill(pageFit);
    return perLineFontSizesForPage(edition.layoutFile, pageIndex, pageFit);
  }, [effectiveWidth, qcfActive, qcfTable, edition.layoutFile, pageIndex, lineCount]);

  const lineSizes = probeState.sizes || fallbackSizes;

  const measuredEmPx = probeState.sizes ? probeState.emPx : null;

  const spaceExtras = React.useMemo(() => {
    if (customLineSize) return null;
    return justifiedSpaceExtrasForPage(
      edition.layoutFile, pageIndex, effectiveWidth - MUSHAF_HORIZONTAL_PADDING, lineSizes, qcfTable, measuredEmPx);
  }, [customLineSize, edition.layoutFile, pageIndex, effectiveWidth, lineSizes, qcfTable, measuredEmPx]);

  // Only trust truncation reports once probing has settled (refined or given up),
  // and only when they match the size we currently render, so stale layout events
  // from a previous size can't trigger a false shrink.
  const probeSettled = !probeStrings || probeState.refined || probeAttempt >= 4;
  const handleLineTruncated = (i, sizeUsed) => {
    if (!probeSettled || customLineSize) return;
    const baseSize = lineSizes[i] || lineSizes[0];
    const adj = fitAdjust[i];
    if (Math.abs(sizeUsed - baseSize * (adj || 1)) > 0.5) return;
    if (!overflowReportedRef.current) {
      overflowReportedRef.current = true;
      if (onLineOverflow) onLineOverflow({ hd: qcfActive });
    }
    if (adj != null && adj <= 0.55) return;
    const hadJustify = adj == null && !!(spaceExtras && spaceExtras[i] > 0);
    setFitAdjust((m) => ({ ...m, [i]: hadJustify ? 1 : Math.max(0.55, (adj || 1) * 0.92) }));
  };

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
      {!probeState.refined && probeStrings ? (
        <View pointerEvents="none" style={{
          position: 'absolute', left: 0, top: 0, opacity: 0, width: 99999,
        }}>
          {Platform.OS === 'web' ? probeStrings.map((s, i) => s == null ? null : (
            <Text
              key={`p${probePass}-${probeAttempt}-${i}`}
              allowFontScaling={false}
              onLayout={(e) => handleProbeLineLayout(probePass, i, e.nativeEvent.layout.width)}
              style={{
                // Without alignSelf the default stretch makes layout.width the container's 99999.
                alignSelf: 'flex-start',
                fontFamily,
                fontSize: probePass === 2 ? probeState.sizes[i] : PROBE_FONT_SIZE,
                writingDirection: 'rtl',
              }}
            >
              {s}
            </Text>
          )) : (
            <Text
              key={`p${probePass}-${probeAttempt}`}
              allowFontScaling={false}
              onTextLayout={(e) => handleProbeTextLayout(probePass, e.nativeEvent.lines)}
              style={{
                alignSelf: 'flex-start',
                fontFamily,
                fontSize: PROBE_FONT_SIZE,
                writingDirection: 'rtl',
              }}
            >
              {probeLineIdxs.map((li, k) => (
                <Text key={li} style={probePass === 2 ? { fontSize: probeState.sizes[li] } : null}>
                  {k > 0 ? '\n' : ''}{probeStrings[li]}
                </Text>
              ))}
            </Text>
          )}
        </View>
      ) : null}
      {items.map((line, i) => {
        if (line.type === 'surah_header') {
          return <SurahCartouche key={`l${i}`} surahId={line.surahId} colors={colors} fontScale={fontScale} />;
        }
        if (line.type === 'bismillah') {
          return <BismillahLine key={`l${i}`} colors={colors} fontScale={fontScale} />;
        }
        const adj = fitAdjust[i];
        const lineSize = (lineSizes[i] || lineSizes[0]) * (adj || 1);
        const lineHeight = mushafLineHeightFor(lineSize);
        return (
          <MushafLine
            key={`l${i}`}
            line={line}
            fontFamily={fontFamily}
            qcfActive={qcfActive}
            colors={colors}
            fontScale={fontScale}
            mushafFontSize={lineSize}
            mushafLineHeight={lineHeight}
            mushafSpaceExtra={adj != null ? 0 : (spaceExtras ? spaceExtras[i] : 0)}
            onLineTruncated={(size) => handleLineTruncated(i, size)}
            playingAyahKey={playingAyahKey}
            playingWordIdx={playingWordIdx}
            playingWordMistake={playingWordMistake}
            onAyahPress={onAyahPress}
            onAyahLongPress={onAyahLongPress}
            customLineSize={customLineSize}
            wordTooltipEnabled={!!settings.showWBW}
            onWordPress={onWordPress}
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

export function PageView({ pageWidth, ...props }) {
  const w = pageWidth || SCREEN_WIDTH;
  return (
    <View style={{ width: w, flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <PageContent pageWidth={pageWidth} {...props} />
      </ScrollView>
      <PageFooter page={props.page} colors={props.colors} />
    </View>
  );
}

export function PageViewContinuous(props) {
  const { width: windowWidth } = useWindowDimensions();
  return (
    <View style={{
      width: windowWidth,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: props.colors.accent + '22',
    }}>
      <PageContent {...props} />
      <PageFooter page={props.page} colors={props.colors} />
    </View>
  );
}
