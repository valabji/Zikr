import * as React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import { SCREEN_WIDTH, getLayoutOffsets } from '../utils/mushafLayout';
import pagesData from '../assets/quran/data/pages.json';
import surahsData from '../assets/quran/data/surahs.json';
import { loadQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import { trackPage } from '../utils/ReadingProgress';
import QuranAudio from '../utils/QuranAudio';
import QuranVoiceFollower from '../utils/QuranVoiceFollower';
import QcfDownloader from '../utils/QcfDownloader';
import { PageView, PageViewContinuous } from '../components/MushafPage';
import QuranMiniPlayer from '../components/QuranMiniPlayer';
import QuranIndexModal from './QuranIndexModal';
import QuranSearchModal from './QuranSearchModal';
import QuranAyahDetailSheet from './QuranAyahDetailSheet';
import QuranAyahActionSheet from './QuranAyahActionSheet';
import QuranSettingsModal from './QuranSettingsModal';
import QuranHdPromptModal from './QuranHdPromptModal';
import QuranPageInfoSheet from './QuranPageInfoSheet';
import QuranHeaderMenu from './QuranHeaderMenu';

const { TOTAL_PAGES, STORAGE_KEYS, DEFAULT_SETTINGS } = QURAN_CONSTANTS;
const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
const ayahKey = (s, a) => `${s}:${a}`;

const HD_SIZE_LABEL = { v1: '~95 MB', v2: '~208 MB' };
const HD_PROMPT_DISMISSED_KEY = (v) => `@quran_hd_prompt_dismissed_${v}`;

export default function QuranScreen({ navigation }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const listRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [ready, setReady] = React.useState(false);
  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [detailAyah, setDetailAyah] = React.useState(null);
  const [actionAyah, setActionAyah] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pageInfoOpen, setPageInfoOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hdPromptVersion, setHdPromptVersion] = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [audioState, setAudioState] = React.useState({ activeAyah: null, isPlaying: false, playingWordIdx: null });
  const [voiceState, setVoiceState] = React.useState({ active: false, activeAyah: null, playingWordIdx: null });
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
        trackPage(page);
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

  const handleVoiceToggle = React.useCallback(() => {
    if (voiceState.active) {
      QuranVoiceFollower.stop();
    } else {
      const startAyah = audioState.activeAyah || pagesData[currentPage - 1].ayahs[0];
      QuranVoiceFollower.start(startAyah);
    }
  }, [voiceState.active, audioState.activeAyah, currentPage]);

  const isContinuous = settings.viewMode === 'continuous';
  const fontScale = settings.customLineSize ? (settings.fontScale || 1) : 1;
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

  const effectiveAyahKey = playingAyahKey
    || (voiceState.active && voiceState.activeAyah
      ? ayahKey(voiceState.activeAyah.surah, voiceState.activeAyah.ayah)
      : null);
  const effectiveWordIdx = voiceState.active
    ? voiceState.playingWordIdx
    : audioState.playingWordIdx;

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
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
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
                playingAyahKey={effectiveAyahKey}
                playingWordIdx={effectiveWordIdx}
                onAyahPress={handleAyahPress}
                onAyahLongPress={handleAyahLongPress}
              />
            );
          }}
        />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 12 }]}>{t('quran.loading')}</Text>
        </View>
      )}
      <QuranMiniPlayer colors={colors} audio={audioState} onClose={closeMiniPlayer} />
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
        tafsirId={settings.tafsirId}
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
      <QuranPageInfoSheet
        visible={pageInfoOpen}
        onClose={() => setPageInfoOpen(false)}
        currentPage={currentPage}
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
