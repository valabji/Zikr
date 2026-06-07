import * as React from 'react';
import {
  View, Text, FlatList, ScrollView, Dimensions, TouchableOpacity,
  ActivityIndicator,
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
import QuranIndexModal from './QuranIndexModal';
import QuranSearchModal from './QuranSearchModal';
import QuranAyahDetailSheet from './QuranAyahDetailSheet';
import QuranSettingsModal from './QuranSettingsModal';
import { loadQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import QuranAudio from '../utils/QuranAudio';
import QcfDownloader, { qcfFontFamilyForPage } from '../utils/QcfDownloader';

let qcfPagesCache = null;
function getQcfPages() {
  if (!qcfPagesCache) {
    qcfPagesCache = require('../assets/quran/data/pages_code_v1.json');
  }
  return qcfPagesCache;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { TOTAL_PAGES, STORAGE_KEYS, FONT_FAMILY, DEFAULT_SETTINGS } = QURAN_CONSTANTS;

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
const toArabicDigits = (n) =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const ayahKey = (s, a) => `${s}:${a}`;

const BISMILLAH_TEXT = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

function SurahCartouche({ surahId, colors, fontScale }) {
  const surah = surahById[surahId];
  return (
    <View style={{ marginVertical: 12, marginHorizontal: 24 }}>
      <View style={{
        borderWidth: 2,
        borderColor: colors.accent,
        backgroundColor: colors.accent + '11',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 4,
      }}>
        <View style={{
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.accent + '66',
          paddingVertical: 8,
        }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 28 * fontScale,
              color: colors.accent,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {`سُورَةُ ${surah.nameAr}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function BismillahLine({ colors, fontScale }) {
  return (
    <View style={{ marginVertical: 6, paddingHorizontal: 16 }}>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 26 * fontScale,
          lineHeight: 56 * fontScale,
          color: colors.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {BISMILLAH_TEXT}
      </Text>
    </View>
  );
}

function AyahFlow({ ayahs, fontFamily, qcfActive, qcfCodeByKey, colors, settings, playingAyahKey, onAyahPress, onAyahLongPress }) {
  const fontScale = settings.fontScale || 1;
  return (
    <View style={{ paddingHorizontal: 18, paddingVertical: 6 }}>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily,
          fontSize: 27 * fontScale,
          lineHeight: 62 * fontScale,
          color: colors.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {ayahs.map((a, i) => {
          const k = ayahKey(a.surah, a.ayah);
          const text = qcfActive && qcfCodeByKey ? (qcfCodeByKey[k] || a.text) : a.text;
          const isPlaying = playingAyahKey === k;
          const segStyle = isPlaying ? { backgroundColor: colors.accent + '33' } : null;
          return (
            <Text
              key={k}
              onPress={() => onAyahPress(a)}
              onLongPress={() => onAyahLongPress(a)}
              style={segStyle}
            >
              {i > 0 ? ' ' : ''}{text.trim()}
              {qcfActive ? null : (
                <Text style={{ fontFamily: FONT_FAMILY, color: colors.accent, fontSize: 22 * fontScale }}>
                  {' '}﴿{toArabicDigits(a.ayah)}﴾
                </Text>
              )}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

function buildBlocks(page) {
  const blocks = [];
  let run = [];
  let lastSurahHeaderRendered = null;
  for (const a of page.ayahs) {
    if (a.ayah === 1 && a.surah !== lastSurahHeaderRendered) {
      if (run.length > 0) {
        blocks.push({ type: 'flow', ayahs: run });
        run = [];
      }
      blocks.push({ type: 'surah', surahId: a.surah });
      if (a.surah !== 1 && a.surah !== 9) {
        blocks.push({ type: 'bismillah' });
      }
      lastSurahHeaderRendered = a.surah;
    }
    run.push(a);
  }
  if (run.length > 0) blocks.push({ type: 'flow', ayahs: run });
  return blocks;
}

function PageView({ page, colors, settings, qcfActive, playingAyahKey, onAyahPress, onAyahLongPress }) {
  const lang = isRTL() ? 'ar' : 'en';
  const fontScale = settings.fontScale || 1;
  const firstSurah = surahById[page.ayahs[0].surah];
  const headerText = lang === 'ar'
    ? `${firstSurah.nameAr} · ${t('quran.juz')} ${toArabicDigits(page.ayahs[0].juz)}`
    : `${firstSurah.nameEn} · ${t('quran.juz')} ${page.ayahs[0].juz}`;

  const qcfPage = qcfActive ? getQcfPages()[page.page - 1] : null;
  const qcfCodeByKey = qcfPage
    ? qcfPage.ayahs.reduce((acc, a) => { acc[`${a.surah}:${a.ayah}`] = a.code; return acc; }, {})
    : null;
  const fontFamily = qcfActive ? qcfFontFamilyForPage(page.page) : FONT_FAMILY;

  const blocks = React.useMemo(() => buildBlocks(page), [page]);

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <View style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.accent + '22',
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}>
        <Text style={[textStyles.base, { color: colors.textSecondary, textAlign: 'center', fontSize: 13 }]} numberOfLines={1}>
          {headerText}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((b, i) => {
          if (b.type === 'surah') return <SurahCartouche key={`s-${i}`} surahId={b.surahId} colors={colors} fontScale={fontScale} />;
          if (b.type === 'bismillah') return <BismillahLine key={`b-${i}`} colors={colors} fontScale={fontScale} />;
          return (
            <AyahFlow
              key={`f-${i}`}
              ayahs={b.ayahs}
              fontFamily={fontFamily}
              qcfActive={qcfActive}
              qcfCodeByKey={qcfCodeByKey}
              colors={colors}
              settings={settings}
              playingAyahKey={playingAyahKey}
              onAyahPress={onAyahPress}
              onAyahLongPress={onAyahLongPress}
            />
          );
        })}
        {settings.showTranslation ? (
          <View style={{
            marginTop: 18,
            marginHorizontal: 16,
            paddingTop: 14,
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
      </ScrollView>
      <View style={{ paddingVertical: 6, alignItems: 'center' }}>
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12 }]}>
          {lang === 'ar' ? toArabicDigits(page.page) : page.page}
        </Text>
      </View>
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
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [audioState, setAudioState] = React.useState({
    activeAyah: null,
    isPlaying: false,
  });
  const [qcfInstalled, setQcfInstalled] = React.useState(false);

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
    const unsubQcf = QcfDownloader.subscribe((st) => setQcfInstalled(st.installed));
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

  const persistLastPage = React.useCallback((page) => {
    AsyncStorage.setItem(STORAGE_KEYS.LAST_PAGE, String(page)).catch(() => {});
  }, []);

  const onMomentumEnd = React.useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    const page = Math.max(1, Math.min(TOTAL_PAGES, idx + 1));
    if (page !== currentPage) {
      setCurrentPage(page);
      persistLastPage(page);
    }
  }, [currentPage, persistLastPage]);

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
    listRef.current?.scrollToOffset({ offset: (target - 1) * SCREEN_WIDTH, animated: false });
    setCurrentPage(target);
    persistLastPage(target);
    setIndexOpen(false);
    setSearchOpen(false);
  }, [persistLastPage]);

  const handleAyahPress = React.useCallback((ayah) => {
    QuranAudio.playAyah(ayah.surah, ayah.ayah);
  }, []);

  const handleAyahLongPress = React.useCallback((ayah) => {
    setDetailAyah({ surah: ayah.surah, ayah: ayah.ayah });
  }, []);

  const closeMiniPlayer = React.useCallback(() => {
    QuranAudio.stop();
  }, []);

  const getItemLayout = React.useCallback((_, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  const initialScrollIndex = React.useMemo(() => {
    if (!ready) return 0;
    return currentPage - 1;
  }, [ready, currentPage]);

  const headerTitle = isRTL()
    ? t('quran.page', { current: toArabicDigits(currentPage), total: toArabicDigits(TOTAL_PAGES) })
    : t('quran.page', { current: currentPage, total: TOTAL_PAGES });

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
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 8 }}>
            <TouchableOpacity onPress={() => setSearchOpen(true)} testID="quran-search-open" style={{ paddingHorizontal: 6 }}>
              <Feather name="search" size={24} color={colors.BYellow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleBookmark} testID="quran-bookmark-toggle" style={{ paddingHorizontal: 6 }}>
              <Feather name="bookmark" size={24} color={isBookmarked ? colors.accent : colors.BYellow} style={{ opacity: isBookmarked ? 1 : 0.7 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIndexOpen(true)} testID="quran-index-open" style={{ paddingHorizontal: 6 }}>
              <Feather name="list" size={24} color={colors.BYellow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} testID="quran-settings-open" style={{ paddingHorizontal: 6 }}>
              <Feather name="settings" size={22} color={colors.BYellow} />
            </TouchableOpacity>
          </View>
        )}
      />
      {ready ? (
        <FlatList
          ref={listRef}
          testID="quran-pager"
          data={pagesData}
          keyExtractor={(item) => String(item.page)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialScrollIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumEnd}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
          renderItem={({ item }) => (
            <PageView
              page={item}
              colors={colors}
              settings={settings}
              qcfActive={!!settings.useQcf && qcfInstalled}
              playingAyahKey={playingAyahKey}
              onAyahPress={handleAyahPress}
              onAyahLongPress={handleAyahLongPress}
            />
          )}
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
      <QuranSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}
