import * as React from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
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
import { FONT_SCALE_RANGE, BOOK_GROUPS } from '../constants/BooksConstants';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, shadow, webCursor } from '../constants/settingsTokens';
import BooksIndexModal from './BooksIndexModal';
import BooksSearchModal from './BooksSearchModal';
import BooksSettingsModal from './BooksSettingsModal';
import BookInfoScreen from './BookInfoScreen';

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
  const [infoBook, setInfoBook] = React.useState(null);
  const [highlightIndex, setHighlightIndex] = React.useState(null);
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

  const openInfo = React.useCallback((item) => {
    setInfoBook(item);
    setMode('info');
  }, []);

  const closeInfo = React.useCallback(() => {
    setMode('library');
    setInfoBook(null);
  }, []);

  const onInfoRead = React.useCallback(() => {
    if (infoBook) openBook(infoBook.id);
  }, [infoBook, openBook]);

  const onInfoDownload = React.useCallback(() => {
    if (infoBook) BooksDownloader.start(infoBook);
  }, [infoBook]);

  const onInfoCancel = React.useCallback(() => {
    if (infoBook) BooksDownloader.cancel(infoBook.id);
  }, [infoBook]);

  const onInfoRemove = React.useCallback(() => {
    if (!infoBook) return;
    const name = lang === 'ar' ? infoBook.nameAr : infoBook.nameEn;
    Alert.alert(name, t('books.removeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('books.remove'), style: 'destructive', onPress: () => BooksDownloader.uninstall(infoBook.id) },
    ]);
  }, [infoBook, lang]);

  const continueBook = React.useMemo(() => {
    const id = settings?.lastBookId;
    if (!id) return null;
    const meta = catalog.find((b) => b.id === id);
    if (!meta) return null;
    const ready = meta.bundled || !!(dlState[id] && dlState[id].installed);
    return ready ? meta : null;
  }, [settings?.lastBookId, catalog, dlState]);

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

  const renderContinueCard = () => {
    if (!continueBook) return null;
    const name = lang === 'ar' ? continueBook.nameAr : continueBook.nameEn;
    return (
      <TouchableOpacity
        testID="books-continue"
        onPress={() => openBook(continueBook.id)}
        style={[{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: RADIUS.card,
          padding: SPACING.lg,
          marginBottom: SPACING.xl,
        }, shadow(colors.shadowColor), webCursor]}
      >
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: withAlpha(colors.primary, 'hairline'),
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Feather name="book-open" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginHorizontal: SPACING.md, ...(lang === 'ar' ? { direction: 'rtl' } : null) }}>
          <Text style={[textStyles.caption, { color: colors.primary, opacity: 0.8 }]}>{t('books.continueReading')}</Text>
          <Text numberOfLines={1} style={[textStyles.subtitle, { color: colors.primary, marginTop: 2 }, lang === 'ar' ? arabicContentStyle() : null]}>{name}</Text>
        </View>
        <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderDownloadAllBanner = () => {
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
        style={[{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          marginBottom: SPACING.xl, paddingVertical: SPACING.md,
          borderRadius: RADIUS.card, backgroundColor: withAlpha(colors.accent, busy ? 'subtle' : 'hairline'),
        }, webCursor]}
      >
        {busy
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Feather name="download-cloud" size={20} color={colors.accent} />}
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 15, marginHorizontal: SPACING.sm }]}>
          {busy
            ? t('books.downloadingAll', { done: fmtNum(installed), total: fmtNum(downloadable.length) })
            : `${t('books.downloadAll')} · ${fmtNum(Math.round(totalMB))} MB`}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCardBadge = (item, st, ready) => {
    if (st && st.downloading) {
      return <Text style={[textStyles.caption, { color: colors.accent }]}>{fmtNum(Math.round((st.progress || 0) * 100))}%</Text>;
    }
    if (st && st.error) {
      return <Feather name="rotate-ccw" size={16} color={colors.DYellow} />;
    }
    if (!ready) {
      return <Feather name="download" size={16} color={colors.textSecondary} />;
    }
    if (!item.bundled) {
      return <Feather name="check-circle" size={16} color={colors.accent} />;
    }
    return null;
  };

  const renderBookCard = (item) => {
    const name = lang === 'ar' ? item.nameAr : item.nameEn;
    const author = lang === 'ar' ? item.authorAr : item.authorEn;
    const st = dlState[item.id];
    const ready = item.bundled || !!(st && st.installed);
    return (
      <TouchableOpacity
        key={item.id}
        testID={`book-${item.id}`}
        onPress={() => openInfo(item)}
        style={[{
          width: '48%',
          backgroundColor: colors.surface,
          borderRadius: RADIUS.card,
          padding: SPACING.md,
          marginBottom: SPACING.md,
        }, shadow(colors.shadowColor), webCursor]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: withAlpha(colors.accent, 'hairline'),
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Feather name="book" size={20} color={colors.accent} />
          </View>
          {renderCardBadge(item, st, ready)}
        </View>
        <Text numberOfLines={2} style={[textStyles.subtitle, { color: colors.text, fontSize: 15, marginTop: SPACING.sm, minHeight: 40 }, lang === 'ar' ? arabicContentStyle() : null]}>{name}</Text>
        {author ? (
          <Text numberOfLines={1} style={[textStyles.caption, { color: colors.textSecondary, marginTop: 2 }, lang === 'ar' ? arabicContentStyle() : null]}>{author}</Text>
        ) : null}
        <Text style={[textStyles.caption, { color: colors.accent, marginTop: SPACING.xs }]}>{t('books.entryCount', { count: fmtNum(item.count) })}</Text>
      </TouchableOpacity>
    );
  };

  const isReady = React.useCallback((item) => {
    const st = dlState[item.id];
    return item.bundled || !!(st && st.installed);
  }, [dlState]);

  const renderGroup = (group, filter) => {
    const books = group.ids
      .map((id) => catalog.find((b) => b.id === id))
      .filter(Boolean)
      .filter(filter);
    if (!books.length) return null;
    return (
      <View key={group.id} style={{ marginBottom: SPACING.lg }}>
        <Text style={[textStyles.bodySmall, {
          color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5,
          marginBottom: SPACING.sm, marginHorizontal: SPACING.xs,
          textAlign: lang === 'ar' ? 'right' : 'left',
        }]}>
          {t(`books.groups.${group.id}`)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', ...(lang === 'ar' ? { direction: 'rtl' } : null) }}>
          {books.map(renderBookCard)}
        </View>
      </View>
    );
  };

  const renderStatusSection = (ready) => {
    const filter = (b) => isReady(b) === ready;
    const count = catalog.filter(filter).length;
    if (!count) return null;
    return (
      <View key={ready ? 'downloaded' : 'notDownloaded'} style={{ marginBottom: SPACING.xl }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginBottom: SPACING.md, marginHorizontal: SPACING.xs,
          ...(lang === 'ar' ? { direction: 'rtl' } : null),
        }}>
          <Feather name={ready ? 'check-circle' : 'download-cloud'} size={18} color={ready ? colors.accent : colors.textSecondary} />
          <Text style={[textStyles.subtitle, { color: colors.text, marginHorizontal: SPACING.sm }]}>
            {t(ready ? 'books.downloadedSection' : 'books.notDownloadedSection')}
          </Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{fmtNum(count)}</Text>
        </View>
        {BOOK_GROUPS.map((g) => renderGroup(g, filter))}
      </View>
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
        <ScrollView
          contentContainerStyle={{
            width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center',
            paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {renderContinueCard()}
          {renderDownloadAllBanner()}
          {renderStatusSection(true)}
          {renderStatusSection(false)}
        </ScrollView>
      </View>
    );
  }

  if (mode === 'info') {
    return (
      <BookInfoScreen
        book={infoBook}
        dlState={infoBook ? dlState[infoBook.id] : null}
        navigation={navigation}
        onBack={closeInfo}
        onRead={onInfoRead}
        onDownload={onInfoDownload}
        onCancel={onInfoCancel}
        onRemove={onInfoRemove}
      />
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
