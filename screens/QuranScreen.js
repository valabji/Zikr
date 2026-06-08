import * as React from 'react';
import {
  View, Text, FlatList, ScrollView, Dimensions, TouchableOpacity,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import CustomHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';
import pagesData from '../assets/quran/data/pages.json';
import surahsData from '../assets/quran/data/surahs.json';
import translationEn from '../assets/quran/data/translation_en.json';
import { getMushafEdition } from '../constants/QuranConstants';

const layoutCache = {};
function getLayout(layoutFile) {
  if (!layoutCache[layoutFile]) {
    if (layoutFile === 'pages_lines_v2') {
      layoutCache[layoutFile] = require('../assets/quran/data/pages_lines_v2.json');
    } else {
      layoutCache[layoutFile] = require('../assets/quran/data/pages_lines_v1.json');
    }
  }
  return layoutCache[layoutFile];
}

const PAGE_CHROME_PX = 12 /* top padding */ + 1 /* border */ + 18 /* footer */;

// Per the KFGQPC implementation strategy, line-justification is baked into
// the per-page QCF v1/v2 fonts. With the bundled UthmanicHafs fallback we
// pick ONE global font size that's small enough for the densest line in the
// whole Mushaf to fit; every line on every page then uses that same size.
// Short lines stay at that size and center themselves — Quran is never
// clipped.

// Count only base Arabic letter shapes — combining marks (tashkeel, shadda,
// tanwin, madda, sukun, superscript alef, etc.) sit above/below and don't
// take horizontal space.
const ARABIC_BASE_LETTER_RE = /[ؠ-يٱ-ۓ]/g;
const ARABIC_BASE_W_FACTOR = 0.45;  // empirical UthmanicHafs base-letter advance / em
// The empirical factor leaves visible slack on most devices because real
// letter widths in UthmanicHafs are narrower than the worst-case ratio
// implies. Multiply the raw fit-size to actually use the full page width.
const MUSHAF_STRETCH_FACTOR = 1.5;

function visibleArabicLen(s) {
  if (!s) return 0;
  const m = s.match(ARABIC_BASE_LETTER_RE);
  return m ? m.length : 0;
}

const GLOBAL_MAX_LINE_VISIBLE = (() => {
  let max = 0;
  for (const file of ['pages_lines_v1', 'pages_lines_v2']) {
    const pages = getLayout(file);
    for (const page of pages) {
      for (const line of page.lines) {
        if (line.type !== 'text') continue;
        let total = 0;
        for (const w of line.words) total += visibleArabicLen(w.ar) + 1;
        if (total > max) max = total;
      }
    }
  }
  return max;
})();

// Compute the Mushaf font size that lets the densest line fit a given window
// width. Called at every render so the layout stretches with rotation, split
// screen, foldables, and web window resize.
function mushafFontSizeForWidth(width) {
  const avail = width - 16;
  const raw = (avail / (GLOBAL_MAX_LINE_VISIBLE * ARABIC_BASE_W_FACTOR)) * MUSHAF_STRETCH_FACTOR;
  return Math.max(12, Math.min(48, Math.floor(raw)));
}

function mushafLineHeightFor(fontSize) {
  return Math.round(fontSize * 1.25) + 2;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Module-load defaults used by LINE_PX (continuous-scroll height estimate).
const MUSHAF_LINE_FONT_SIZE = mushafFontSizeForWidth(SCREEN_WIDTH);
const MUSHAF_LINE_HEIGHT_PX = mushafLineHeightFor(MUSHAF_LINE_FONT_SIZE);

// Per-line and per-chrome height contributions matching the actual styles
// rendered by SurahCartouche / BismillahLine / MushafLine / PageFooter.
const LINE_PX = {
  surah_header: 56,   // ornate SVG banner (width/8.16) + 8+8 margins → ~54-60
  bismillah: 60,      // paddingV 4*2 + lineHeight 52
  text: MUSHAF_LINE_HEIGHT_PX,  // derived from MUSHAF_LINE_FONT_SIZE
};

const layoutOffsetCache = {};
function getLayoutOffsets(layoutFile) {
  if (layoutOffsetCache[layoutFile]) return layoutOffsetCache[layoutFile];
  const pages = getLayout(layoutFile);
  const heights = new Array(pages.length);
  const offsets = new Array(pages.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < pages.length; i++) {
    let h = PAGE_CHROME_PX;
    for (const line of pages[i].lines) {
      h += LINE_PX[line.type] || LINE_PX.text;
    }
    heights[i] = h;
    offsets[i + 1] = offsets[i] + h;
  }
  layoutOffsetCache[layoutFile] = { heights, offsets };
  return layoutOffsetCache[layoutFile];
}
import QuranIndexModal from './QuranIndexModal';
import QuranSearchModal from './QuranSearchModal';
import QuranAyahDetailSheet from './QuranAyahDetailSheet';
import QuranAyahActionSheet from './QuranAyahActionSheet';
import QuranSettingsModal from './QuranSettingsModal';
import QuranHdPromptModal from './QuranHdPromptModal';

const HD_SIZE_LABEL = { v1: '~95 MB', v2: '~208 MB' };
const HD_PROMPT_DISMISSED_KEY = (v) => `@quran_hd_prompt_dismissed_${v}`;
import { loadQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import QuranAudio from '../utils/QuranAudio';
import QcfDownloader, { qcfFontFamilyForPage } from '../utils/QcfDownloader';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { SURA_BORDER_PATH_D, SURA_BORDER_VIEWBOX_W, SURA_BORDER_VIEWBOX_H, SURA_BORDER_VIEWBOX_MIN_Y } from '../constants/SuraBorderSvg';

const { TOTAL_PAGES, STORAGE_KEYS, FONT_FAMILY, DEFAULT_SETTINGS } = QURAN_CONSTANTS;

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
const toArabicDigits = (n) =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const ayahKey = (s, a) => `${s}:${a}`;

function surahNameGlyph(surahId) {
  // Sura Names V1 font: each surah maps to a PUA codepoint where the last
  // 3 hex digits are the surah number written in decimal — surah 12 -> 0xE012,
  // surah 100 -> 0xE100, surah 114 -> 0xE114.
  const code = 0xE000 + parseInt(String(surahId).padStart(3, '0'), 16);
  return String.fromCodePoint(code);
}

const SURA_BORDER_ASPECT = SURA_BORDER_VIEWBOX_W / SURA_BORDER_VIEWBOX_H;
// viewBox is "0 -500 16320 2000" → vertical midline at y=500.
const SURA_BORDER_MID_Y = SURA_BORDER_VIEWBOX_MIN_Y + SURA_BORDER_VIEWBOX_H / 2;

function SurahCartouche({ surahId, colors, fontScale }) {
  const surah = surahById[surahId];
  const ayahCountStr = toArabicDigits(surah.ayahCount);
  const placeAr = surah.type === 'meccan' ? 'مكية' : 'مدنية';

  const containerWidth = SCREEN_WIDTH - (8 + 18) * 2;
  const borderHeight = containerWidth / SURA_BORDER_ASPECT;

  // All coordinates in SVG viewBox space (W=16320, H=2000, x in [0,16320], y in [-500,1500]).
  const midX = SURA_BORDER_VIEWBOX_W / 2;
  const nameFontSize = SURA_BORDER_VIEWBOX_H * 0.55 * fontScale;
  // SVG text y coordinate is the baseline; shift down so glyphs sit vertically centered.
  const nameTextY = SURA_BORDER_MID_Y + nameFontSize * 0.32;

  // Medallion centers in screen px (pixel-density scan: 20.8% / 79.3% of width).
  // Vertical center in screen px: viewBox y=488 → (488+500)/2000 = 0.494 of borderHeight.
  const medallionBoxWidth = containerWidth * 0.08;
  const leftMedPx = containerWidth * 0.208;
  const rightMedPx = containerWidth * 0.793;
  const medallionFontSize = Math.max(7, Math.min(borderHeight * 0.28, 11));

  return (
    <View style={{ marginVertical: 8, marginHorizontal: 18, alignItems: 'center' }}>
      <View style={{ width: containerWidth, height: borderHeight }}>
        <Svg
          width={containerWidth}
          height={borderHeight}
          viewBox={`0 ${SURA_BORDER_VIEWBOX_MIN_Y} ${SURA_BORDER_VIEWBOX_W} ${SURA_BORDER_VIEWBOX_H}`}
        >
          <Path fill={colors.accent} d={SURA_BORDER_PATH_D} />
          <SvgText
            x={midX}
            y={nameTextY}
            fill={colors.text}
            fontFamily="KFGQPC_SurahNames"
            fontSize={nameFontSize}
            textAnchor="middle"
          >
            {surahNameGlyph(surahId)}
          </SvgText>
        </Svg>
        {/* Mecca/Medina label - RN Text overlay so the UthmanicHafs font applies. */}
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
        {/* Ayah count label — body font, not UthmanicHafs, so digits aren't
            rendered as ornamental ayah-end markers. */}
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
    </View>
  );
}

// KFGQPC Bismillah font: single ornate calligraphic ligature at U+FDFD.
const BISMILLAH_GLYPH = '﷽';

function BismillahLine({ colors, fontScale }) {
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

function MushafLine({ line, fontFamily, qcfActive, colors, fontScale, mushafFontSize, mushafLineHeight, playingAyahKey, onAyahPress, onAyahLongPress }) {
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

function PageView(props) {
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

function PageViewContinuous(props) {
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

function MiniPlayer({ colors, audio, onClose }) {
  if (!audio.activeAyah) return null;
  const surah = surahById[audio.activeAyah.surah];
  const lang = isRTL() ? 'ar' : 'en';
  const label = `${lang === 'ar' ? surah.nameAr : surah.nameEn} · ${lang === 'ar' ? toArabicDigits(audio.activeAyah.ayah) : audio.activeAyah.ayah}`;
  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.primaryDark,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: colors.accent + '44',
    }}>
      <Text style={[textStyles.subtitle, { color: colors.BYellow, flex: 1, fontSize: 14 }]} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity onPress={() => QuranAudio.previous()} style={{ paddingHorizontal: 6 }}>
        <Feather name="skip-back" size={22} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => QuranAudio.toggle()} style={{ paddingHorizontal: 10 }}>
        <Feather name={audio.isPlaying ? 'pause' : 'play'} size={26} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => QuranAudio.next()} style={{ paddingHorizontal: 6 }}>
        <Feather name="skip-forward" size={22} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 8 }}>
        <Feather name="x" size={22} color={colors.BYellow} />
      </TouchableOpacity>
    </View>
  );
}

export default function QuranScreen({ navigation }) {
  const colors = useColors();
  const listRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [ready, setReady] = React.useState(false);
  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [detailAyah, setDetailAyah] = React.useState(null);
  const [actionAyah, setActionAyah] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [hdPromptVersion, setHdPromptVersion] = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [audioState, setAudioState] = React.useState({
    activeAyah: null,
    isPlaying: false,
  });
  const [qcfState, setQcfState] = React.useState({ v1: { installed: false }, v2: { installed: false } });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lastRaw, bmRaw, s] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_PAGE),
          AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
          loadQuranSettings(),
        ]);
        if (cancelled) return;
        const last = lastRaw ? Math.max(1, Math.min(TOTAL_PAGES, parseInt(lastRaw, 10))) : 1;
        setCurrentPage(last);
        setBookmarks(bmRaw ? JSON.parse(bmRaw) : []);
        setSettings(s);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
    const unsubSettings = subscribeQuranSettings(setSettings);
    const unsubAudio = QuranAudio.subscribe((st) => {
      setAudioState({ activeAyah: st.activeAyah, isPlaying: st.isPlaying });
    });
    const unsubQcf = QcfDownloader.subscribe((st) => setQcfState(st));
    return () => {
      cancelled = true;
      unsubSettings();
      unsubAudio();
      unsubQcf();
    };
  }, []);

  React.useEffect(() => {
    return () => {
      QuranAudio.stop();
    };
  }, []);

  // One-time HD-fonts nudge per QCF version that isn't installed.
  React.useEffect(() => {
    if (!ready) return;
    const edition = getMushafEdition(settings.mushafEdition);
    const v = edition.qcfVersion;
    const s = qcfState[v];
    if (!s || s.installed || s.downloading) {
      setHdPromptVersion(null);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(HD_PROMPT_DISMISSED_KEY(v)).then((flag) => {
      if (cancelled || flag === '1') return;
      const timer = setTimeout(() => {
        if (!cancelled) setHdPromptVersion(v);
      }, 1200);
      return () => clearTimeout(timer);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [ready, settings.mushafEdition, qcfState]);

  const handleHdPromptDownload = React.useCallback((dontAskAgain) => {
    const v = hdPromptVersion;
    setHdPromptVersion(null);
    if (!v) return;
    if (dontAskAgain) {
      AsyncStorage.setItem(HD_PROMPT_DISMISSED_KEY(v), '1').catch(() => {});
    }
    QcfDownloader.start(v).catch(() => {});
    setSettingsOpen(true);
  }, [hdPromptVersion]);

  const handleHdPromptDismiss = React.useCallback((dontAskAgain) => {
    const v = hdPromptVersion;
    setHdPromptVersion(null);
    if (v && dontAskAgain) {
      AsyncStorage.setItem(HD_PROMPT_DISMISSED_KEY(v), '1').catch(() => {});
    }
  }, [hdPromptVersion]);

  const persistLastPage = React.useCallback((page) => {
    AsyncStorage.setItem(STORAGE_KEYS.LAST_PAGE, String(page)).catch(() => {});
  }, []);

  const currentPageRef = React.useRef(currentPage);
  currentPageRef.current = currentPage;
  const persistRef = React.useRef(persistLastPage);
  persistRef.current = persistLastPage;

  const viewabilityConfigCallbackPairs = React.useRef([{
    viewabilityConfig: { itemVisiblePercentThreshold: 60 },
    onViewableItemsChanged: ({ viewableItems }) => {
      if (!viewableItems || viewableItems.length === 0) return;
      const page = viewableItems[0].item.page;
      if (page !== currentPageRef.current) {
        currentPageRef.current = page;
        setCurrentPage(page);
        persistRef.current(page);
      }
    },
  }]);

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleBookmark = React.useCallback(() => {
    const exists = bookmarks.some((b) => b.page === currentPage);
    const firstAyah = pagesData[currentPage - 1].ayahs[0];
    const next = exists
      ? bookmarks.filter((b) => b.page !== currentPage)
      : [...bookmarks, {
          page: currentPage,
          surah: firstAyah.surah,
          ayah: firstAyah.ayah,
          addedAt: Date.now(),
        }];
    setBookmarks(next);
    AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next)).catch(() => {});
  }, [bookmarks, currentPage]);

  const jumpToPage = React.useCallback((page) => {
    const target = Math.max(1, Math.min(TOTAL_PAGES, page));
    listRef.current?.scrollToIndex({ index: target - 1, animated: false });
    currentPageRef.current = target;
    setCurrentPage(target);
    persistLastPage(target);
    setIndexOpen(false);
    setSearchOpen(false);
  }, [persistLastPage]);

  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  const handleAyahPress = React.useCallback((ayah) => {
    const mode = settingsRef.current.ayahInteractionMode || 'menu';
    if (mode === 'direct') {
      QuranAudio.playAyah(ayah.surah, ayah.ayah);
    } else {
      setActionAyah({ surah: ayah.surah, ayah: ayah.ayah });
    }
  }, []);

  const handleAyahLongPress = React.useCallback((ayah) => {
    setDetailAyah({ surah: ayah.surah, ayah: ayah.ayah });
  }, []);

  const closeMiniPlayer = React.useCallback(() => {
    QuranAudio.stop();
  }, []);

  const isContinuous = settings.viewMode === 'continuous';
  const fontScale = settings.fontScale || 1;
  const activeLayoutFile = getMushafEdition(settings.mushafEdition).layoutFile;

  const getItemLayout = React.useCallback((_, index) => {
    if (!isContinuous) {
      return { length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index };
    }
    const { heights, offsets } = getLayoutOffsets(activeLayoutFile);
    return {
      length: heights[index] * fontScale,
      offset: offsets[index] * fontScale,
      index,
    };
  }, [isContinuous, fontScale, activeLayoutFile]);

  const initialScrollIndex = React.useMemo(() => {
    if (!ready) return 0;
    return currentPage - 1;
  }, [ready, currentPage]);

  const headerSurah = (() => {
    const pg = pagesData[currentPage - 1];
    return pg ? surahById[pg.ayahs[0].surah] : null;
  })();
  const headerTitle = headerSurah ? (isRTL() ? headerSurah.nameAr : headerSurah.nameEn) : '';

  const playingAyahKey = audioState.activeAyah
    ? ayahKey(audioState.activeAyah.surah, audioState.activeAyah.ayah)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="quran-screen">
      <CustomHeader
        title={headerTitle}
        isHome={true}
        navigation={navigation}
        Left={() => (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12 }}>
            <TouchableOpacity onPress={toggleBookmark} testID="quran-bookmark-toggle" hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} style={{ paddingHorizontal: 10 }}>
              <Feather
                name="bookmark"
                size={22}
                color={isBookmarked ? colors.accent : colors.BYellow}
                style={{ opacity: isBookmarked ? 1 : 0.85 }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIndexOpen(true)} testID="quran-index-open" hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} style={{ paddingHorizontal: 10 }}>
              <Feather name="book-open" size={22} color={colors.BYellow} />
            </TouchableOpacity>
          </View>
        )}
      />
      {ready ? (
        <FlatList
          ref={listRef}
          key={isContinuous ? 'cont' : 'paged'}
          testID="quran-pager"
          data={pagesData}
          keyExtractor={(item) => String(item.page)}
          horizontal={!isContinuous}
          pagingEnabled={!isContinuous}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={initialScrollIndex}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            let offset;
            if (isContinuous) {
              const { offsets } = getLayoutOffsets(activeLayoutFile);
              offset = offsets[info.index] * fontScale;
            } else {
              offset = SCREEN_WIDTH * info.index;
            }
            setTimeout(() => listRef.current?.scrollToOffset({ offset, animated: false }), 50);
          }}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          windowSize={isContinuous ? 5 : 3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
          renderItem={({ item }) => {
            const edition = getMushafEdition(settings.mushafEdition);
            const qcfReady = !!(qcfState[edition.qcfVersion] && qcfState[edition.qcfVersion].installed);
            const Component = isContinuous ? PageViewContinuous : PageView;
            return (
              <Component
                page={item}
                colors={colors}
                settings={settings}
                qcfVersion={qcfReady ? edition.qcfVersion : null}
                playingAyahKey={playingAyahKey}
                onAyahPress={handleAyahPress}
                onAyahLongPress={handleAyahLongPress}
              />
            );
          }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 12 }]}>{t('quran.loading')}</Text>
        </View>
      )}
      <MiniPlayer colors={colors} audio={audioState} onClose={closeMiniPlayer} />
      <QuranIndexModal
        visible={indexOpen}
        onClose={() => setIndexOpen(false)}
        currentPage={currentPage}
        bookmarks={bookmarks}
        onSelectPage={jumpToPage}
        onOpenSearch={() => { setIndexOpen(false); setSearchOpen(true); }}
        onOpenSettings={() => { setIndexOpen(false); setSettingsOpen(true); }}
        onRemoveBookmark={(page) => {
          const next = bookmarks.filter((b) => b.page !== page);
          setBookmarks(next);
          AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next)).catch(() => {});
        }}
      />
      <QuranSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAyah={({ page }) => jumpToPage(page)}
      />
      <QuranAyahDetailSheet
        ayah={detailAyah}
        onClose={() => setDetailAyah(null)}
      />
      <QuranAyahActionSheet
        ayah={actionAyah}
        onClose={() => setActionAyah(null)}
        onPlay={(a) => QuranAudio.playAyah(a.surah, a.ayah)}
        onDetails={(a) => setDetailAyah({ surah: a.surah, ayah: a.ayah })}
      />
      <QuranSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <QuranHdPromptModal
        visible={!!hdPromptVersion}
        version={hdPromptVersion}
        sizeLabel={HD_SIZE_LABEL[hdPromptVersion] || ''}
        onDownload={handleHdPromptDownload}
        onDismiss={handleHdPromptDismiss}
      />
    </View>
  );
}
