import * as React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CHeader';
import { useColors, useIsBrightTheme } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import * as Font from 'expo-font';
import { getLayoutOffsets, maxPageHeightForWidth, arForHafs, ayahLayoutWords, ayahPageForLayout, pageAyahsForLayout } from '../utils/mushafLayout';
import pagesData from '../assets/quran/data/pages.json';
import surahsData from '../assets/quran/data/surahs.json';
import translationEn from '../assets/quran/data/translation_en.json';
import ShareCardModal from '../components/ShareCardModal';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import { trackPage } from '../utils/ReadingProgress';
import QuranAudio from '../utils/QuranAudio';
import QuranVoiceFollower from '../utils/QuranVoiceFollower';
import QcfDownloader, { qcfFontFamilyForPage } from '../utils/QcfDownloader';
import { PageView, PageViewContinuous } from '../components/MushafPage';
import QuranMiniPlayer from '../components/QuranMiniPlayer';
import QuranVoiceFollowBar from '../components/QuranVoiceFollowBar';
import QuranIndexModal from './QuranIndexModal';
import QuranSearchModal from './QuranSearchModal';
import QuranAyahDetailSheet from './QuranAyahDetailSheet';
import QuranAyahActionSheet from './QuranAyahActionSheet';
import QuranSettingsModal from './QuranSettingsModal';
import QuranHdPromptModal from './QuranHdPromptModal';
import QuranPageInfoSheet from './QuranPageInfoSheet';
import QuranHeaderMenu from './QuranHeaderMenu';
import QuranWordTooltip from '../components/QuranWordTooltip';
import TajweedLegend from '../components/TajweedLegend';

const { TOTAL_PAGES, STORAGE_KEYS, DEFAULT_SETTINGS } = QURAN_CONSTANTS;
const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
const verseTextByKey = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseTextByKey[`${a.surah}:${a.ayah}`] = a.text;
  }
}
// Mirrors the reader's active font: when the HD bundle for the current edition
// is installed and its page fonts are loaded, draw the ayah from QCF glyph
// codes (grouped by page font); otherwise the caller falls back to plain
// UthmanicHafs text.
function ayahQcfSegments(surah, ayah, settings, qcfState, dark) {
  const edition = getMushafEdition(settings.mushafEdition);
  const version = edition.qcfVersion;
  if (!(qcfState[version] && qcfState[version].installed)) return null;
  const words = ayahLayoutWords(edition.layoutFile, `${surah}:${ayah}`).filter((w) => w.code);
  if (!words.length) return null;
  const pages = [...new Set(words.map((w) => w.page))];
  if (!pages.every((p) => Font.isLoaded(qcfFontFamilyForPage(version, p, dark)))) return null;
  const segments = [];
  words.forEach((w, i) => {
    const fontFamily = qcfFontFamilyForPage(version, w.page, dark);
    const piece = (i === 0 ? '' : ' ') + w.code;
    const last = segments[segments.length - 1];
    if (last && last.fontFamily === fontFamily) last.text += piece;
    else segments.push({ text: piece, fontFamily });
  });
  return segments;
}

function buildAyahShareContent(a, lang, settings, qcfState, dark) {
  const key = `${a.surah}:${a.ayah}`;
  const surah = surahsData[a.surah - 1];
  const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  const reference = lang === 'ar'
    ? `${surah.nameAr} ${toArabicDigits(a.surah)}:${toArabicDigits(a.ayah)}`
    : `${surah.nameEn} ${a.surah}:${a.ayah}`;
  const plain = arForHafs(verseTextByKey[key] || '');
  return {
    arabic: plain,
    arabicSegments: ayahQcfSegments(a.surah, a.ayah, settings, qcfState, dark)
      || [{ text: plain, fontFamily: 'UthmanicHafs' }],
    translation: translationEn[key],
    reference,
  };
}
const ayahKey = (s, a) => `${s}:${a}`;

const HD_SIZE_LABEL = { v1: '~95 MB', v2: '~208 MB', v4: '~167 MB' };
const HD_PROMPT_DISMISSED_KEY = (v) => `@quran_hd_prompt_dismissed_${v}`;

export default function QuranScreen({ navigation }) {
  const colors = useColors();
  const darkQcf = !useIsBrightTheme();
  const insets = useSafeAreaInsets();
  const listRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [ready, setReady] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const restoreRef = React.useRef({ pending: false, target: 1, tries: 0 });

  const beginRestore = React.useCallback((page) => {
    const pending = page > 1;
    restoreRef.current = { pending, target: page, tries: 0 };
    setRestoring(pending);
  }, []);
  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [detailAyah, setDetailAyah] = React.useState(null);
  const [actionAyah, setActionAyah] = React.useState(null);
  const [wordTooltip, setWordTooltip] = React.useState(null);
  const [shareAyah, setShareAyah] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pageInfoOpen, setPageInfoOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hdPromptVersion, setHdPromptVersion] = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [audioState, setAudioState] = React.useState({ activeAyah: null, isPlaying: false, playingWordIdx: null });
  const [voiceState, setVoiceState] = React.useState({ active: false, activeAyah: null, playingWordIdx: null, mistake: false, pendingPrompt: null });
  const [qcfState, setQcfState] = React.useState({ v1: { installed: false }, v2: { installed: false }, v4: { installed: false } });

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
        currentPageRef.current = last;
        setBookmarks(bmRaw ? JSON.parse(bmRaw) : []);
        setSettings(s);
        beginRestore(last);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
    const unsubSettings = subscribeQuranSettings(setSettings);
    const unsubAudio = QuranAudio.subscribe((st) => {
      setAudioState({ activeAyah: st.activeAyah, isPlaying: st.isPlaying, playingWordIdx: st.playingWordIdx ?? null });
    });
    const unsubVoice = QuranVoiceFollower.subscribe((st) => setVoiceState(st));
    const unsubQcf = QcfDownloader.subscribe((st) => setQcfState(st));
    return () => {
      cancelled = true;
      unsubSettings();
      unsubAudio();
      unsubVoice();
      unsubQcf();
    };
  }, []);

  React.useEffect(() => {
    return () => {
      QuranAudio.stop();
      QuranVoiceFollower.stop();
    };
  }, []);

  const promptShownRef = React.useRef(null);
  React.useEffect(() => {
    const p = voiceState.pendingPrompt;
    if (!p) { promptShownRef.current = null; return; }
    if (promptShownRef.current === p) return;
    promptShownRef.current = p;
    const surah = surahById[p.toSurah];
    const name = surah ? (isRTL() ? surah.nameAr : surah.nameEn) : '';
    Alert.alert(
      t('quran.voiceMismatchTitle'),
      t('quran.voiceMismatchMessage', { to: `${name} ${p.toAyah}` }),
      [
        { text: t('quran.voiceMismatchLookAhead'), onPress: () => QuranVoiceFollower.resolvePrompt('lookahead') },
        { text: t('quran.voiceMismatchMistake'), onPress: () => QuranVoiceFollower.resolvePrompt('mistake') },
        { text: t('common.cancel'), style: 'cancel', onPress: () => QuranVoiceFollower.resolvePrompt('dismiss') },
      ],
      { cancelable: true, onDismiss: () => QuranVoiceFollower.resolvePrompt('dismiss') }
    );
  }, [voiceState.pendingPrompt]);

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

  const hdFallbackRef = React.useRef(false);
  React.useEffect(() => {
    if (!settings.customLineSize) hdFallbackRef.current = false;
  }, [settings.customLineSize]);
  const overflowWarnedRef = React.useRef(false);
  const qcfErrorWarnedRef = React.useRef(false);

  const handleLineOverflow = React.useCallback(({ hd }) => {
    if (hd) {
      if (hdFallbackRef.current || settingsRef.current.customLineSize) return;
      hdFallbackRef.current = true;
      setQuranSettings({ customLineSize: true });
      Alert.alert(t('quran.overflowHdTitle'), t('quran.overflowHdBody'));
      return;
    }
    if (overflowWarnedRef.current) return;
    overflowWarnedRef.current = true;
    AsyncStorage.getItem(STORAGE_KEYS.OVERFLOW_WARNED).then((flag) => {
      if (flag === '1') return;
      AsyncStorage.setItem(STORAGE_KEYS.OVERFLOW_WARNED, '1').catch(() => {});
      Alert.alert(t('quran.overflowWarnTitle'), t('quran.overflowWarnBody'), [
        { text: t('common.ok'), style: 'cancel' },
        { text: t('quran.overflowOpenSettings'), onPress: () => setSettingsOpen(true) },
      ]);
    }).catch(() => {});
  }, []);

  const handleQcfLoadError = React.useCallback(() => {
    if (qcfErrorWarnedRef.current) return;
    qcfErrorWarnedRef.current = true;
    Alert.alert(t('quran.qcfLoadFailedTitle'), t('quran.qcfLoadFailedBody'), [
      { text: t('common.ok'), style: 'cancel' },
      { text: t('quran.overflowOpenSettings'), onPress: () => setSettingsOpen(true) },
    ]);
  }, []);

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
      const item = viewableItems[0].item;
      const page = isPairedRef.current ? item.rightPage.page : item.page;
      const restore = restoreRef.current;
      if (restore.pending) {
        const landed = isPairedRef.current
          ? Math.floor((page - 1) / 2) === Math.floor((restore.target - 1) / 2)
          : isContinuousRef.current
            ? Math.abs(page - restore.target) <= 1
            : page === restore.target;
        if (landed) {
          restore.pending = false;
          setRestoring(false);
          if (page !== currentPageRef.current) {
            currentPageRef.current = page;
            setCurrentPage(page);
          }
        }
        return;
      }
      if (page !== currentPageRef.current) {
        currentPageRef.current = page;
        setCurrentPage(page);
        persistRef.current(page);
        trackPage(page);
      }
    },
  }]);

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleBookmark = React.useCallback(() => {
    const exists = bookmarks.some((b) => b.page === currentPage);
    const firstAyah = pageAyahsForLayout(activeLayoutFile, currentPage)[0];
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
    restoreRef.current.pending = false;
    setRestoring(false);
    const idx = isPairedRef.current ? Math.floor((target - 1) / 2) : target - 1;
    listRef.current?.scrollToIndex({ index: idx, animated: false });
    currentPageRef.current = target;
    setCurrentPage(target);
    persistLastPage(target);
    setIndexOpen(false);
    setSearchOpen(false);
  }, [persistLastPage]);

  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;
  const activeEdition = getMushafEdition(settings.mushafEdition);
  const activeLayoutFile = activeEdition.layoutFile;

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

  const handleWordPress = React.useCallback((word, x, y) => {
    setWordTooltip({ ar: word.ar, en: word.en, x, y });
  }, []);

  const closeMiniPlayer = React.useCallback(() => {
    QuranAudio.stop();
  }, []);

  const handleVoiceToggle = React.useCallback(() => {
    if (voiceState.active) {
      QuranVoiceFollower.stop();
    } else {
      const startAyah = audioState.activeAyah || pageAyahsForLayout(activeLayoutFile, currentPage)[0];
      QuranVoiceFollower.start(startAyah);
    }
  }, [voiceState.active, audioState.activeAyah, currentPage, activeLayoutFile]);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isContinuous = settings.viewMode === 'continuous';
  const isLandscape = windowWidth > windowHeight;
  const isPaired = !isContinuous && isLandscape && settings.landscapeTwoPage !== false;
  const fontScale = settings.customLineSize ? (settings.fontScale || 1) : 1;
  const readerBg = activeEdition.qcfVersion === 'v4' && settings.qcf4HighContrast
    ? (darkQcf ? '#000000' : '#FFFFFF')
    : colors.background;

  const availableHeight = windowHeight - insets.top - insets.bottom - 56;
  const effectiveBaseWidth = isPaired ? Math.floor(windowWidth / 2) : windowWidth;
  const maxWidthForFit = React.useMemo(() => {
    if (isContinuous) return effectiveBaseWidth;
    if (maxPageHeightForWidth(activeLayoutFile, effectiveBaseWidth) <= availableHeight) return effectiveBaseWidth;
    let lo = 50, hi = effectiveBaseWidth;
    for (let i = 0; i < 15; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (maxPageHeightForWidth(activeLayoutFile, mid) <= availableHeight) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return Math.max(50, lo);
  }, [isContinuous, activeLayoutFile, availableHeight, effectiveBaseWidth]);

  const isPairedRef = React.useRef(isPaired);
  isPairedRef.current = isPaired;
  const isContinuousRef = React.useRef(isContinuous);
  isContinuousRef.current = isContinuous;

  const listData = React.useMemo(() => {
    if (!isPaired) return pagesData;
    const pairs = [];
    for (let i = 0; i < pagesData.length; i += 2) {
      pairs.push({ rightPage: pagesData[i], leftPage: pagesData[i + 1] || null });
    }
    return pairs;
  }, [isPaired]);

  const getItemLayout = React.useCallback((_, index) => {
    if (isContinuous) {
      const { heights, offsets } = getLayoutOffsets(activeLayoutFile);
      return {
        length: heights[index] * fontScale,
        offset: offsets[index] * fontScale,
        index,
      };
    }
    return { length: windowWidth, offset: windowWidth * index, index };
  }, [isContinuous, fontScale, activeLayoutFile, windowWidth]);

  const offsetForIndex = React.useCallback((index) => {
    if (isContinuous) {
      const { offsets } = getLayoutOffsets(activeLayoutFile);
      return offsets[index] * fontScale;
    }
    return windowWidth * index;
  }, [isContinuous, activeLayoutFile, fontScale, windowWidth]);

  const attemptRestore = React.useCallback(() => {
    const r = restoreRef.current;
    if (!r.pending) return;
    r.tries += 1;
    if (r.tries > 10) {
      r.pending = false;
      setRestoring(false);
      return;
    }
    const idx = isPairedRef.current ? Math.floor((r.target - 1) / 2) : r.target - 1;
    try {
      listRef.current?.scrollToIndex({ index: idx, animated: false });
    } catch {}
  }, []);

  const handleListLayout = React.useCallback(() => { attemptRestore(); }, [attemptRestore]);

  React.useEffect(() => {
    beginRestore(currentPageRef.current);
  }, [isContinuous, isPaired, beginRestore]);

  React.useEffect(() => {
    if (!ready || !restoring) return;
    const id = setInterval(attemptRestore, 350);
    return () => clearInterval(id);
  }, [ready, restoring, attemptRestore]);

  const headerSurah = (() => {
    const first = pageAyahsForLayout(activeLayoutFile, currentPage)[0];
    return first ? surahById[first.surah] : null;
  })();
  const headerTitle = headerSurah ? (isRTL() ? headerSurah.nameAr : headerSurah.nameEn) : '';

  const playingAyahKey = audioState.activeAyah
    ? ayahKey(audioState.activeAyah.surah, audioState.activeAyah.ayah)
    : null;

  const effectiveAyahKey = playingAyahKey
    || (voiceState.active && voiceState.activeAyah
      ? ayahKey(voiceState.activeAyah.surah, voiceState.activeAyah.ayah)
      : null);
  const effectiveWordIdx = voiceState.active
    ? voiceState.playingWordIdx
    : audioState.playingWordIdx;
  const effectiveWordMistake = voiceState.active && voiceState.mistake;

  React.useEffect(() => {
    if (!ready || !effectiveAyahKey) return;
    const page = ayahPageForLayout(activeLayoutFile, effectiveAyahKey);
    if (!page || page === currentPageRef.current) return;
    currentPageRef.current = page;
    setCurrentPage(page);
    persistLastPage(page);
    try {
      const idx = isPairedRef.current ? Math.floor((page - 1) / 2) : page - 1;
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    } catch {}
  }, [effectiveAyahKey, ready, persistLastPage, activeLayoutFile]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="quran-screen">
      <CustomHeader
        title={headerTitle}
        isHome={true}
        navigation={navigation}
        Left={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 18 }}>
            <TouchableOpacity onPress={() => setMenuOpen(true)} testID="quran-header-menu" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="more-vertical" size={24} color={colors.BYellow} />
            </TouchableOpacity>
          </View>
        )}
      />
      {ready ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: readerBg }}>
        <FlatList
          style={{ flex: 1 }}
          ref={listRef}
          key={isContinuous ? 'cont' : (isPaired ? 'paired' : 'paged')}
          testID="quran-pager"
          data={listData}
          keyExtractor={(item) => isPaired ? String(item.rightPage.page) : String(item.page)}
          horizontal={!isContinuous}
          pagingEnabled={!isContinuous}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onLayout={handleListLayout}
          onScrollToIndexFailed={(info) => {
            const offset = offsetForIndex(info.index);
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
            const qcfVersion = qcfReady ? edition.qcfVersion : null;
            const sharedProps = {
              colors, settings, qcfVersion,
              playingAyahKey: effectiveAyahKey,
              playingWordIdx: effectiveWordIdx,
              playingWordMistake: effectiveWordMistake,
              onAyahPress: handleAyahPress,
              onAyahLongPress: handleAyahLongPress,
              onWordPress: handleWordPress,
              onLineOverflow: handleLineOverflow,
              onQcfLoadError: handleQcfLoadError,
            };
            const fitEnabled = settings.fitPageToHeight !== false;
            if (isPaired) {
              const basePageWidth = windowWidth / 2;
              const effectivePageWidth = fitEnabled
                ? Math.min(basePageWidth, maxWidthForFit)
                : basePageWidth;
              const makeSlot = (pageData) => (
                <View style={{ flex: 1, alignItems: 'center' }}>
                  {pageData && <PageView page={pageData} pageWidth={effectivePageWidth} {...sharedProps} />}
                </View>
              );
              const leftSlot = makeSlot(item.leftPage);
              const rightSlot = makeSlot(item.rightPage);
              return (
                <View style={{ width: windowWidth, flex: 1, flexDirection: 'row' }}>
                  {isRTL() ? rightSlot : leftSlot}
                  {isRTL() ? leftSlot : rightSlot}
                </View>
              );
            }
            if (!isContinuous) {
              const effectivePageWidth = fitEnabled
                ? Math.min(windowWidth, maxWidthForFit)
                : windowWidth;
              return (
                <View style={{ width: windowWidth, flex: 1, alignItems: 'center' }}>
                  <PageView page={item} pageWidth={effectivePageWidth} {...sharedProps} />
                </View>
              );
            }
            return <PageViewContinuous page={item} {...sharedProps} />;
          }}
        />
        {getMushafEdition(settings.mushafEdition).qcfVersion === 'v4' &&
          qcfState.v4.installed && !audioState.activeAyah &&
          settings.tajweedLegend !== false && settings.tajweedLegend !== 'off' ? (
          <TajweedLegend
            mode={settings.tajweedLegend === 'full' ? 'full' : 'compact'}
            onToggle={() => setQuranSettings({ tajweedLegend: settings.tajweedLegend === 'full' ? 'compact' : 'full' })}
          />
        ) : null}
        {restoring ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: readerBg, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 12 }]}>{t('quran.loading')}</Text>
        </View>
      )}
      <QuranMiniPlayer
        colors={colors}
        audio={audioState}
        onClose={closeMiniPlayer}
        aboveSlot={
          getMushafEdition(settings.mushafEdition).qcfVersion === 'v4' &&
          qcfState.v4.installed &&
          settings.tajweedLegendPlayer !== 'off' ? (
            <TajweedLegend
              mode={settings.tajweedLegendPlayer === 'full' ? 'full' : 'compact'}
              onToggle={() => setQuranSettings({ tajweedLegendPlayer: settings.tajweedLegendPlayer === 'full' ? 'compact' : 'full' })}
            />
          ) : null
        }
      />
      <QuranVoiceFollowBar colors={colors} voice={voiceState} />
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
        onUpdateBookmarkNote={(page, note) => {
          const next = bookmarks.map((b) => (b.page === page ? { ...b, note } : b));
          setBookmarks(next);
          AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next)).catch(() => {});
        }}
      />
      <QuranSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAyah={({ surah, ayah, page }) => jumpToPage(ayahPageForLayout(activeLayoutFile, ayahKey(surah, ayah)) || page)}
      />
      <QuranAyahDetailSheet
        ayah={detailAyah}
        onClose={() => setDetailAyah(null)}
        tafsirId={settings.tafsirId}
        onShare={(a) => setShareAyah({ surah: a.surah, ayah: a.ayah })}
      />
      <QuranAyahActionSheet
        ayah={actionAyah}
        onClose={() => setActionAyah(null)}
        onPlay={(a) => QuranAudio.playAyah(a.surah, a.ayah)}
        onFollow={(a) => { QuranAudio.stop(); QuranVoiceFollower.start({ surah: a.surah, ayah: a.ayah }); }}
        onDetails={(a) => setDetailAyah({ surah: a.surah, ayah: a.ayah })}
        onShare={(a) => setShareAyah({ surah: a.surah, ayah: a.ayah })}
      />
      <ShareCardModal
        visible={!!shareAyah}
        content={shareAyah ? buildAyahShareContent(shareAyah, isRTL() ? 'ar' : 'en', settings, qcfState, darkQcf) : null}
        onClose={() => setShareAyah(null)}
      />
      <QuranSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <QuranWordTooltip
        word={wordTooltip}
        onClose={() => setWordTooltip(null)}
        colors={colors}
      />
      <QuranHdPromptModal
        visible={!!hdPromptVersion}
        version={hdPromptVersion}
        sizeLabel={HD_SIZE_LABEL[hdPromptVersion] || ''}
        onDownload={handleHdPromptDownload}
        onDismiss={handleHdPromptDismiss}
      />
      <QuranPageInfoSheet
        visible={pageInfoOpen}
        onClose={() => setPageInfoOpen(false)}
        currentPage={currentPage}
        layoutFile={activeLayoutFile}
        onSelectAyah={({ page }) => { if (page) jumpToPage(page); setPageInfoOpen(false); }}
        colors={colors}
        tafsirId={settings.tafsirId}
      />
      <QuranHeaderMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        voiceActive={voiceState.active}
        isBookmarked={isBookmarked}
        onVoiceToggle={handleVoiceToggle}
        onPageInfo={() => setPageInfoOpen(true)}
        onBookmark={toggleBookmark}
        onIndex={() => setIndexOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />
    </View>
  );
}
