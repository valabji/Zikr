import * as React from 'react';
import { View, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';
import { useColors } from '@/constants/Colors';
import { t, isRTL, toArabicDigits } from '@/locales/i18n';
import { setLastRead } from '@/utils/BooksLibrary';
import { FONT_SCALE_RANGE } from '@/constants/BooksConstants';
import { SPACING, CONTENT_MAX_WIDTH } from '@/constants/settingsTokens';
import BooksIndexModal from '@/screens/BooksIndexModal';
import BooksSearchModal from '@/screens/BooksSearchModal';
import BooksSettingsModal from '@/screens/BooksSettingsModal';
import BookPage from '@/components/BookPage';
import BookEntry from '@/components/BookEntry';
import EntryFlashCard from '@/components/EntryFlashCard';
import { paginateBook, estimateEntryHeight } from '@/utils/booksPaginate';

export default function BookReader({ navigation, book, bookmarks, onToggleBookmark, settings, initialIndex, onClose }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const listRef = React.useRef(null);
  const pageListRef = React.useRef(null);
  const paginationRef = React.useRef(null);
  const pageRestoredRef = React.useRef(false);
  const currentIndexRef = React.useRef(initialIndex);
  const restoredRef = React.useRef(false);
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);

  const [indexOpen, setIndexOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(null);
  const highlightTimeoutRef = React.useRef(null);

  React.useEffect(() => () => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
  }, []);

  const jumpToIndex = React.useCallback((index, { highlight = false } = {}) => {
    setIndexOpen(false);
    setSearchOpen(false);
    currentIndexRef.current = index;
    const pag = paginationRef.current;
    requestAnimationFrame(() => {
      try {
        if (pag) {
          pageListRef.current?.scrollToIndex({ index: pag.entryToPage[index] ?? 0, animated: false });
        } else {
          listRef.current?.scrollToIndex({ index, animated: false });
        }
      } catch {}
    });
    if (highlight) {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      setHighlightIndex(index);
      highlightTimeoutRef.current = setTimeout(() => setHighlightIndex(null), 1500);
    }
  }, []);

  const jumpToChapter = React.useCallback((chapterId) => {
    setIndexOpen(false);
    const pag = paginationRef.current;
    if (!pag) return;
    const pageIndex = pag.chapterToPage.get(chapterId);
    if (pageIndex == null) return;
    requestAnimationFrame(() => {
      try {
        pageListRef.current?.scrollToIndex({ index: pageIndex, animated: true });
      } catch {}
    });
  }, []);

  const selectByNumber = React.useCallback((n) => {
    if (!book) return;
    const idx = book.entries.findIndex((e) => e.n === n);
    if (idx >= 0) jumpToIndex(idx, { highlight: true });
  }, [book, jumpToIndex]);

  const bookRef = React.useRef(book);
  bookRef.current = book;

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

  const pageViewabilityPairs = React.useRef([{
    viewabilityConfig: { itemVisiblePercentThreshold: 60 },
    onViewableItemsChanged: ({ viewableItems }) => {
      if (!viewableItems || viewableItems.length === 0) return;
      const pageIndex = viewableItems[0].index;
      if (pageIndex == null) return;
      const pag = paginationRef.current;
      const id = bookRef.current?.id;
      if (!pag || !id) return;
      const entryIndex = pag.pageFirstEntry[pageIndex] ?? 0;
      currentIndexRef.current = entryIndex;
      setLastRead(id, entryIndex);
    },
  }]);

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
  const viewMode = settings?.viewMode === 'pages' ? 'pages' : 'scroll';
  const isPaged = viewMode === 'pages';

  const [pagerHeight, setPagerHeight] = React.useState(0);
  const bookmarkSet = React.useMemo(() => new Set(bookmarks), [bookmarks]);

  const pageContentWidth = Math.min(winW, CONTENT_MAX_WIDTH) - SPACING.sm * 2 - SPACING.md * 2;

  const pagination = React.useMemo(() => {
    if (!isPaged || !book || pagerHeight <= 0) return null;
    return paginateBook({
      entries: book.entries,
      chapters: book.chapters,
      pageHeight: pagerHeight - SPACING.md * 2,
      fontScale,
      showTranslation,
      containerWidth: pageContentWidth,
    });
  }, [isPaged, book, pagerHeight, fontScale, showTranslation, pageContentWidth]);
  paginationRef.current = pagination;

  React.useEffect(() => {
    restoredRef.current = false;
    pageRestoredRef.current = false;
  }, [isPaged, book]);

  React.useEffect(() => {
    if (!isPaged || !pagination || pageRestoredRef.current) return;
    pageRestoredRef.current = true;
    const targetPage = pagination.entryToPage[currentIndexRef.current] || 0;
    if (targetPage <= 0) return;
    requestAnimationFrame(() => {
      try {
        pageListRef.current?.scrollToIndex({ index: targetPage, animated: false });
      } catch {}
    });
  }, [isPaged, pagination]);

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

  const renderEntry = ({ item, index }) => (
    <EntryFlashCard
      active={index === highlightIndex}
      baseColor={colors.surface}
      flashColor={colors.accent + '55'}
      style={{
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
      }}
    >
      <BookEntry
        item={item}
        index={index}
        colors={colors}
        fontScale={fontScale}
        showTranslation={showTranslation}
        bookmarked={bookmarks.includes(index)}
        onToggleBookmark={onToggleBookmark}
        fmtNum={fmtNum}
      />
    </EntryFlashCard>
  );

  const renderPage = ({ item }) => (
    <BookPage
      page={item}
      width={winW}
      height={pagerHeight}
      chapters={book.chapters}
      colors={colors}
      fontScale={fontScale}
      showTranslation={showTranslation}
      bookmarkSet={bookmarkSet}
      onToggleBookmark={onToggleBookmark}
      onJumpChapter={jumpToChapter}
      highlightIndex={highlightIndex}
      lang={lang}
      fmtNum={fmtNum}
      indexTitle={t('books.chapters')}
    />
  );

  const bookName = book ? (lang === 'ar' ? book.nameAr : book.nameEn) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="books-reader">
      <CustomHeader
        title={bookName}
        navigation={navigation}
        onBackPress={onClose}
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
        isPaged ? (
          <View testID="books-page-container" style={{ flex: 1 }} onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}>
            {pagination ? (
              <FlatList
                key="books-page-pager"
                ref={pageListRef}
                testID="books-page-pager"
                data={pagination.pages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => String(index)}
                renderItem={renderPage}
                getItemLayout={(data, index) => ({ length: winW, offset: winW * index, index })}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={5}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    try {
                      pageListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    } catch {}
                  }, 50);
                }}
                viewabilityConfigCallbackPairs={pageViewabilityPairs.current}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            )}
          </View>
        ) : (
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
        )
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
        onSelectChapter={isPaged ? jumpToChapter : null}
        onRemoveBookmark={(idx) => onToggleBookmark(idx)}
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
