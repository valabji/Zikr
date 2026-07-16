import * as React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CHeader';
import { useColors, useIsBrightTheme } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL } from '@/locales/i18n';
import { QURAN_CONSTANTS, getMushafEdition } from '@/constants/QuranConstants';
import { fitWidthForHeight } from '@/utils/mushafLayout';
import { ayahPageForLayout, pageAyahsForLayout } from '@/utils/mushafIndex';
import pagesData from '@assets/quran/data/pages.json';
import surahsData from '@assets/quran/data/surahs.json';
import ShareCardModal from '@/components/ShareCardModal';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '@/utils/QuranSettings';
import { buildAyahShareContent } from '@/utils/quranShareContent';
import QuranAudio from '@/utils/QuranAudio';
import QuranVoiceFollower from '@/utils/QuranVoiceFollower';
import QcfDownloader from '@/utils/QcfDownloader';
import { useHdPrompt } from '@/hooks/useHdPrompt';
import { useQuranAlerts } from '@/hooks/useQuranAlerts';
import { useQuranAudioState } from '@/hooks/useQuranAudioState';
import { useQuranBookmarks } from '@/hooks/useQuranBookmarks';
import { useQuranPaging } from '@/hooks/useQuranPaging';
import MushafListItem from '@/components/MushafListItem';
import QuranMiniPlayer from '@/components/QuranMiniPlayer';
import QuranVoiceFollowBar from '@/components/QuranVoiceFollowBar';
import QuranIndexModal from './QuranIndexModal';
import QuranSearchModal from './QuranSearchModal';
import QuranAyahDetailSheet from './QuranAyahDetailSheet';
import QuranAyahActionSheet from './QuranAyahActionSheet';
import QuranSettingsModal from './QuranSettingsModal';
import QuranHdPromptModal from './QuranHdPromptModal';
import QuranPageInfoSheet from './QuranPageInfoSheet';
import QuranHeaderMenu from './QuranHeaderMenu';
import QuranWordTooltip from '@/components/QuranWordTooltip';
import TajweedLegend from '@/components/TajweedLegend';

const { TOTAL_PAGES, STORAGE_KEYS, DEFAULT_SETTINGS } = QURAN_CONSTANTS;
const ayahKey = (s, a) => `${s}:${a}`;

export default function QuranScreen({ navigation }) {
  const colors = useColors();
  const darkQcf = !useIsBrightTheme();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = React.useState(false);
  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [detailAyah, setDetailAyah] = React.useState(null);
  const [actionAyah, setActionAyah] = React.useState(null);
  const [wordTooltip, setWordTooltip] = React.useState(null);
  const [shareAyah, setShareAyah] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pageInfoOpen, setPageInfoOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [qcfState, setQcfState] = React.useState({ v1: { installed: false }, v2: { installed: false }, v4: { installed: false } });

  const { audioState, voiceState } = useQuranAudioState();

  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;
  const activeEdition = getMushafEdition(settings.mushafEdition);
  const activeLayoutFile = activeEdition.layoutFile;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isContinuous = settings.viewMode === 'continuous';
  const isLandscape = windowWidth > windowHeight;
  const isPaired = !isContinuous && isLandscape && settings.landscapeTwoPage !== false;
  const fontScale = settings.customLineSize ? (settings.fontScale || 1) : 1;

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

  const {
    listRef, currentPage, restoring, setInitialPage, jumpToPage,
    viewabilityConfigCallbackPairs, getItemLayout, offsetForIndex, handleListLayout,
  } = useQuranPaging({
    ready, isPaired, isContinuous, activeLayoutFile, fontScale, windowWidth,
    followAyahKey: effectiveAyahKey,
  });

  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, updateBookmarkNote } =
    useQuranBookmarks(currentPage, activeLayoutFile);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lastRaw, s] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_PAGE),
          loadQuranSettings(),
        ]);
        if (cancelled) return;
        setSettings(s);
        setInitialPage(lastRaw ? Math.max(1, Math.min(TOTAL_PAGES, parseInt(lastRaw, 10))) : 1);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
    const unsubSettings = subscribeQuranSettings(setSettings);
    const unsubQcf = QcfDownloader.subscribe((st) => setQcfState(st));
    return () => {
      cancelled = true;
      unsubSettings();
      unsubQcf();
    };
  }, []);

  const openSettings = React.useCallback(() => setSettingsOpen(true), []);
  const { hdPromptVersion, hdSizeLabel, handleHdPromptDownload, handleHdPromptDismiss } =
    useHdPrompt({ ready, settings, qcfState, onOpenSettings: openSettings });

  const { handleLineOverflow, handleQcfLoadError } = useQuranAlerts({
    settingsRef,
    customLineSize: settings.customLineSize,
    onOpenSettings: openSettings,
  });

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

  const readerBg = activeEdition.qcfVersion === 'v4' && settings.qcf4HighContrast
    ? (darkQcf ? '#000000' : '#FFFFFF')
    : colors.background;

  const availableHeight = windowHeight - insets.top - insets.bottom - 56;
  const effectiveBaseWidth = isPaired ? Math.floor(windowWidth / 2) : windowWidth;
  const maxWidthForFit = React.useMemo(() => (
    isContinuous ? effectiveBaseWidth : fitWidthForHeight(activeLayoutFile, effectiveBaseWidth, availableHeight)
  ), [isContinuous, activeLayoutFile, availableHeight, effectiveBaseWidth]);

  const listData = React.useMemo(() => {
    if (!isPaired) return pagesData;
    const pairs = [];
    for (let i = 0; i < pagesData.length; i += 2) {
      pairs.push({ rightPage: pagesData[i], leftPage: pagesData[i + 1] || null });
    }
    return pairs;
  }, [isPaired]);

  const qcfReady = !!(qcfState[activeEdition.qcfVersion] && qcfState[activeEdition.qcfVersion].installed);
  const pageProps = {
    colors, settings,
    qcfVersion: qcfReady ? activeEdition.qcfVersion : null,
    playingAyahKey: effectiveAyahKey,
    playingWordIdx: effectiveWordIdx,
    playingWordMistake: effectiveWordMistake,
    onAyahPress: handleAyahPress,
    onAyahLongPress: handleAyahLongPress,
    onWordPress: handleWordPress,
    onLineOverflow: handleLineOverflow,
    onQcfLoadError: handleQcfLoadError,
  };

  const headerSurah = (() => {
    const first = pageAyahsForLayout(activeLayoutFile, currentPage)[0];
    return first ? surahsData[first.surah - 1] : null;
  })();
  const headerTitle = headerSurah ? (isRTL() ? headerSurah.nameAr : headerSurah.nameEn) : '';

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
          renderItem={({ item }) => (
            <MushafListItem
              item={item}
              isPaired={isPaired}
              isContinuous={isContinuous}
              fitEnabled={settings.fitPageToHeight !== false}
              windowWidth={windowWidth}
              maxWidthForFit={maxWidthForFit}
              sharedProps={pageProps}
            />
          )}
        />
        {activeEdition.qcfVersion === 'v4' &&
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
          activeEdition.qcfVersion === 'v4' &&
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
        onSelectPage={(page) => { jumpToPage(page); setIndexOpen(false); }}
        onOpenSearch={() => { setIndexOpen(false); setSearchOpen(true); }}
        onOpenSettings={() => { setIndexOpen(false); setSettingsOpen(true); }}
        onRemoveBookmark={removeBookmark}
        onUpdateBookmarkNote={updateBookmarkNote}
      />
      <QuranSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAyah={({ surah, ayah, page }) => {
          jumpToPage(ayahPageForLayout(activeLayoutFile, ayahKey(surah, ayah)) || page);
          setSearchOpen(false);
        }}
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
        sizeLabel={hdSizeLabel}
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
