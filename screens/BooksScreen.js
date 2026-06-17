import * as React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { t, isRTL, arabicContentStyle } from '../locales/i18n';
import {
  getBooksCatalog, loadBookAsync,
  getLastRead, setLastRead,
  getBookmarks, setBookmarks,
} from '../utils/BooksLibrary';
import BooksDownloader from '../utils/BooksDownloader';
import { loadBooksSettings, setBooksSettings, subscribeBooksSettings } from '../utils/BooksSettings';
import { FONT_SCALE_RANGE } from '../constants/BooksConstants';
import BooksIndexModal from './BooksIndexModal';
import BooksSearchModal from './BooksSearchModal';
import BooksSettingsModal from './BooksSettingsModal';

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const ENTRY_FRAME_HEIGHT = 32 /* padding */ + 44 /* header row */ + 16 /* card margins */;

const estimateEntryHeight = (item, fontScale, showTranslation, containerWidth) => {
  const hasAr = !!item.textAr;
  const hasEn = !!item.textEn;
  const showEn = hasEn && (showTranslation || !hasAr);
  let height = ENTRY_FRAME_HEIGHT;
  if (hasAr) {
    const charsPerLine = Math.max(8, containerWidth / (20 * fontScale * 0.55));
    const lines = Math.max(1, Math.ceil((item.textAr || '').length / charsPerLine));
    height += lines * (38 * fontScale);
  }
  if (showEn) {
    const enFontSize = (hasAr ? 15 : 18) * fontScale;
    const charsPerLine = Math.max(8, containerWidth / (enFontSize * 0.5));
    const lines = Math.max(1, Math.ceil((item.textEn || '').length / charsPerLine));
    height += (hasAr ? 12 : 0) + lines * ((hasAr ? 24 : 30) * fontScale);
  }
  return height;
};

function EntryFlashCard({ active, baseColor, flashColor, style, children }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!active) return;
    anim.setValue(1);
    Animated.timing(anim, { toValue: 0, duration: 900, delay: 350, useNativeDriver: false }).start();
  }, [active, anim]);
  return (
    <Animated.View style={[style, { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [baseColor, flashColor] }) }]}>
      {children}
    </Animated.View>
  );
}

export default function BooksScreen({ navigation }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const listRef = React.useRef(null);
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);

  const catalog = React.useMemo(() => getBooksCatalog(), []);
  const [mode, setMode] = React.useState('library');
  const [book, setBook] = React.useState(null);
  const [bookmarks, setLocalBookmarks] = React.useState([]);
  const [settings, setSettings] = React.useState(null);
  const [initialIndex, setInitialIndex] = React.useState(0);
  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dlState, setDlState] = React.useState({});
  const [highlightIndex, setHighlightIndex] = React.useState(null);
  const pendingOpenRef = React.useRef(null);
  const highlightTimeoutRef = React.useRef(null);

  React.useEffect(() => () => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
  }, []);

  React.useEffect(() => {
    loadBooksSettings().then(setSettings);
    return subscribeBooksSettings(setSettings);
  }, []);

  React.useEffect(() => {
    BooksDownloader.checkInstalled(catalog.filter((b) => !b.bundled).map((b) => b.id));
    return BooksDownloader.subscribe(setDlState);
  }, [catalog]);

  const currentIndexRef = React.useRef(0);
  const restoredRef = React.useRef(false);

  const openBook = React.useCallback(async (id) => {
    const loaded = await loadBookAsync(id);
    if (!loaded) return;
    const [last, bm] = await Promise.all([getLastRead(id), getBookmarks(id)]);
    const safeIndex = Math.max(0, Math.min((loaded.entries.length || 1) - 1, last));
    currentIndexRef.current = safeIndex;
    restoredRef.current = false;
    setBook(loaded);
    setLocalBookmarks(bm);
    setInitialIndex(safeIndex);
    setBooksSettings({ lastBookId: id });
    setMode('reader');
  }, []);

  const closeBook = React.useCallback(() => {
    setMode('library');
    setBook(null);
    setIndexOpen(false);
    setSearchOpen(false);
    setSettingsOpen(false);
    setHighlightIndex(null);
  }, []);

  React.useEffect(() => {
    const id = pendingOpenRef.current;
    if (id && dlState[id] && dlState[id].installed) {
      pendingOpenRef.current = null;
      openBook(id);
    }
  }, [dlState, openBook]);

  const onPressCatalog = React.useCallback((item) => {
    const st = dlState[item.id];
    if (item.bundled || (st && st.installed)) { openBook(item.id); return; }
    if (st && st.downloading) { BooksDownloader.cancel(item.id); return; }
    pendingOpenRef.current = item.id;
    BooksDownloader.start(item);
  }, [dlState, openBook]);

  const onLongPressCatalog = React.useCallback((item) => {
    if (item.bundled || !dlState[item.id] || !dlState[item.id].installed) return;
    const name = lang === 'ar' ? item.nameAr : item.nameEn;
    Alert.alert(name, t('books.removeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('books.remove'), style: 'destructive', onPress: () => BooksDownloader.uninstall(item.id) },
    ]);
  }, [dlState, lang]);

  const jumpToIndex = React.useCallback((index, { highlight = false } = {}) => {
    setIndexOpen(false);
    setSearchOpen(false);
    currentIndexRef.current = index;
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToIndex({ index, animated: false });
      } catch {}
    });
    if (highlight) {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      setHighlightIndex(index);
      highlightTimeoutRef.current = setTimeout(() => setHighlightIndex(null), 1500);
    }
  }, []);

  const selectByNumber = React.useCallback((n) => {
    if (!book) return;
    const idx = book.entries.findIndex((e) => e.n === n);
    if (idx >= 0) jumpToIndex(idx, { highlight: true });
  }, [book, jumpToIndex]);

  const toggleBookmark = React.useCallback((index) => {
    if (!book) return;
    const exists = bookmarks.includes(index);
    const next = exists ? bookmarks.filter((i) => i !== index) : [...bookmarks, index];
    setLocalBookmarks(next);
    setBookmarks(book.id, next);
  }, [book, bookmarks]);

  const viewabilityConfigCallbackPairs = React.useRef([{
    viewabilityConfig: { itemVisiblePercentThreshold: 50 },
    onViewableItemsChanged: ({ viewableItems }) => {
      if (!viewableItems || viewableItems.length === 0) return;
      const index = viewableItems[0].index;
      if (index == null || index === currentIndexRef.current) return;
      currentIndexRef.current = index;
      const id = bookRef.current?.id;
      if (id) setLastRead(id, index);
    },
  }]);

  const bookRef = React.useRef(book);
  bookRef.current = book;

  const handleListLayout = React.useCallback(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const idx = currentIndexRef.current;
    if (idx <= 0) return;
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToIndex({ index: idx, animated: false });
      } catch {}
    });
  }, []);

  const fontScale = settings?.fontScale ?? FONT_SCALE_RANGE.default;
  const showTranslation = !!settings?.showTranslation;

  const entryLayouts = React.useMemo(() => {
    if (!book) return [];
    const containerWidth = Dimensions.get('window').width - 56;
    let offset = 4;
    return book.entries.map((entry, index) => {
      const length = estimateEntryHeight(entry, fontScale, showTranslation, containerWidth);
      const layout = { length, offset, index };
      offset += length;
      return layout;
    });
  }, [book, fontScale, showTranslation]);

  const getItemLayout = React.useCallback(
    (data, index) => entryLayouts[index] || { length: 0, offset: 0, index },
    [entryLayouts]
  );

  const renderCatalogAccessory = (item, st, ready) => {
    if (ready) {
      return <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={22} color={colors.textSecondary} />;
    }
    if (st && st.downloading) {
      return (
        <View style={{ alignItems: 'center', width: 52 }}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 11, marginTop: 2 }]}>
            {fmtNum(Math.round((st.progress || 0) * 100))}%
          </Text>
        </View>
      );
    }
    const failed = !!(st && st.error);
    return (
      <View style={{ alignItems: 'center', width: 52 }}>
        <Feather name={failed ? 'rotate-ccw' : 'download'} size={22} color={failed ? colors.DYellow : colors.accent} />
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
          {failed ? t('books.downloadRetry') : `${item.sizeMB} MB`}
        </Text>
      </View>
    );
  };

  const renderCatalogHeader = () => {
    const downloadable = catalog.filter((b) => !b.bundled);
    if (!downloadable.length) return null;
    const pending = downloadable.filter((b) => !(dlState[b.id] && dlState[b.id].installed));
    if (!pending.length) return null;
    const busy = downloadable.some((b) => dlState[b.id] && dlState[b.id].downloading);
    const installed = downloadable.length - pending.length;
    const totalMB = pending.reduce((sum, b) => sum + (b.sizeMB || 0), 0);
    return (
      <TouchableOpacity
        testID="books-download-all"
        disabled={busy}
        onPress={() => BooksDownloader.startAll(pending)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          marginHorizontal: 14, marginTop: 14, marginBottom: 2, paddingVertical: 12,
          borderRadius: 12, backgroundColor: colors.accent + (busy ? '14' : '22'),
        }}
      >
        {busy
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Feather name="download-cloud" size={20} color={colors.accent} />}
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 15, marginHorizontal: 8 }]}>
          {busy
            ? t('books.downloadingAll', { done: fmtNum(installed), total: fmtNum(downloadable.length) })
            : `${t('books.downloadAll')} · ${fmtNum(Math.round(totalMB))} MB`}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCatalogItem = ({ item }) => {
    const name = lang === 'ar' ? item.nameAr : item.nameEn;
    const author = lang === 'ar' ? item.authorAr : item.authorEn;
    const st = dlState[item.id];
    const ready = item.bundled || !!(st && st.installed);
    const countLabel = t('books.entryCount', { count: fmtNum(item.count) });
    return (
      <TouchableOpacity
        testID={`book-${item.id}`}
        onPress={() => onPressCatalog(item)}
        onLongPress={() => onLongPressCatalog(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '22',
        }}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: colors.accent + '22',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Feather name={ready ? 'book' : 'cloud'} size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1, marginHorizontal: 14, ...(lang === 'ar' ? { direction: 'rtl' } : null) }}>
          <Text style={[textStyles.subtitle, { color: colors.text }, lang === 'ar' ? arabicContentStyle() : null]} numberOfLines={1}>{name}</Text>
          {author ? (
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }, lang === 'ar' ? arabicContentStyle() : null]} numberOfLines={1}>{author}</Text>
          ) : null}
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 12, marginTop: 2 }]}>{countLabel}</Text>
        </View>
        {renderCatalogAccessory(item, st, ready)}
      </TouchableOpacity>
    );
  };

  const renderEntry = ({ item, index }) => {
    const bookmarked = bookmarks.includes(index);
    const hasAr = !!item.textAr;
    const hasEn = !!item.textEn;
    const showEn = hasEn && (showTranslation || !hasAr);
    return (
      <EntryFlashCard
        active={index === highlightIndex}
        baseColor={colors.surface}
        flashColor={colors.accent + '55'}
        style={{
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 8,
          padding: 16,
          direction: hasAr ? 'rtl' : 'ltr',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{
            minWidth: 34, height: 34, borderRadius: 17, paddingHorizontal: 8,
            backgroundColor: colors.accent + '22',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{fmtNum(item.n)}</Text>
          </View>
          <TouchableOpacity
            testID={`book-bookmark-${index}`}
            onPress={() => toggleBookmark(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {hasAr ? (
          <Text
            style={arabicContentStyle({
              fontFamily: FONT_FAMILY,
              fontSize: 20 * fontScale,
              lineHeight: 38 * fontScale,
              color: colors.text,
            })}
          >
            {item.textAr}
          </Text>
        ) : null}
        {showEn ? (
          <Text style={[textStyles.base, {
            color: hasAr ? colors.textSecondary : colors.text,
            fontSize: (hasAr ? 15 : 18) * fontScale,
            lineHeight: (hasAr ? 24 : 30) * fontScale,
            marginTop: hasAr ? 12 : 0,
            textAlign: 'left',
            writingDirection: 'ltr',
          }]}>
            {item.textEn}
          </Text>
        ) : null}
      </EntryFlashCard>
    );
  };

  if (mode === 'library') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} testID="books-screen">
        <CustomHeader title={t('navigation.books')} isHome={true} navigation={navigation} />
        <FlatList
          key="books-catalog"
          data={catalog}
          keyExtractor={(item) => item.id}
          renderItem={renderCatalogItem}
          ListHeaderComponent={renderCatalogHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      </View>
    );
  }

  const bookName = book ? (lang === 'ar' ? book.nameAr : book.nameEn) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="books-reader">
      <CustomHeader
        title={bookName}
        navigation={navigation}
        onBackPress={closeBook}
        Left={() => (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 10 }}>
            <TouchableOpacity onPress={() => setSearchOpen(true)} testID="books-search-btn" style={{ paddingHorizontal: 6 }} hitSlop={{ top: 10, bottom: 10 }}>
              <Feather name="search" size={22} color={colors.BYellow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIndexOpen(true)} testID="books-index-btn" style={{ paddingHorizontal: 6 }} hitSlop={{ top: 10, bottom: 10 }}>
              <Feather name="list" size={22} color={colors.BYellow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} testID="books-settings-btn" style={{ paddingHorizontal: 6 }} hitSlop={{ top: 10, bottom: 10 }}>
              <Feather name="settings" size={20} color={colors.BYellow} />
            </TouchableOpacity>
          </View>
        )}
      />
      {book && settings ? (
        <FlatList
          key="books-pager"
          ref={listRef}
          testID="books-pager"
          data={book.entries}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderEntry}
          getItemLayout={getItemLayout}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={9}
          onLayout={handleListLayout}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({ index: info.index, animated: false });
              } catch {}
            }, 50);
          }}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 20 }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      <BooksIndexModal
        visible={indexOpen}
        onClose={() => setIndexOpen(false)}
        book={book}
        bookmarks={bookmarks}
        onSelectEntry={jumpToIndex}
        onRemoveBookmark={(idx) => toggleBookmark(idx)}
        onOpenSearch={() => { setIndexOpen(false); setSearchOpen(true); }}
        onOpenSettings={() => { setIndexOpen(false); setSettingsOpen(true); }}
      />
      <BooksSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        bookId={book?.id}
        onSelectEntry={selectByNumber}
      />
      <BooksSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}
