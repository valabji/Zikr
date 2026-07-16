import * as React from 'react';
import { Alert } from 'react-native';
import { t, isRTL } from '@/locales/i18n';
import {
  getBooksCatalog, loadBookAsync,
  getLastRead, getBookmarks, setBookmarks,
} from '@/utils/BooksLibrary';
import BooksDownloader from '@/utils/BooksDownloader';
import { loadBooksSettings, setBooksSettings, subscribeBooksSettings } from '@/utils/BooksSettings';
import { useBookDownloads } from '@/hooks/useBookDownloads';
import BooksLibrary from '@/components/BooksLibrary';
import BookReader from '@/components/BookReader';
import BookInfoScreen from './BookInfoScreen';

export default function BooksScreen({ navigation }) {
  const lang = isRTL() ? 'ar' : 'en';
  const catalog = React.useMemo(() => getBooksCatalog(), []);
  const [mode, setMode] = React.useState('library');
  const [book, setBook] = React.useState(null);
  const [bookmarks, setLocalBookmarks] = React.useState([]);
  const [settings, setSettings] = React.useState(null);
  const [initialIndex, setInitialIndex] = React.useState(0);
  const [infoBook, setInfoBook] = React.useState(null);
  const { dlState, isReady } = useBookDownloads(catalog);

  React.useEffect(() => {
    loadBooksSettings().then(setSettings);
    return subscribeBooksSettings(setSettings);
  }, []);

  const openBook = React.useCallback(async (id) => {
    const loaded = await loadBookAsync(id);
    if (!loaded) return;
    const [last, bm] = await Promise.all([getLastRead(id), getBookmarks(id)]);
    const safeIndex = Math.max(0, Math.min((loaded.entries.length || 1) - 1, last));
    setBook(loaded);
    setLocalBookmarks(bm);
    setInitialIndex(safeIndex);
    setBooksSettings({ lastBookId: id });
    setMode('reader');
  }, []);

  const closeBook = React.useCallback(() => {
    setMode('library');
    setBook(null);
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
    return isReady(meta) ? meta : null;
  }, [settings?.lastBookId, catalog, isReady]);

  const toggleBookmark = React.useCallback((index) => {
    if (!book) return;
    const exists = bookmarks.includes(index);
    const next = exists ? bookmarks.filter((i) => i !== index) : [...bookmarks, index];
    setLocalBookmarks(next);
    setBookmarks(book.id, next);
  }, [book, bookmarks]);

  if (mode === 'library') {
    return (
      <BooksLibrary
        navigation={navigation}
        catalog={catalog}
        dlState={dlState}
        isReady={isReady}
        continueBook={continueBook}
        onOpenBook={openBook}
        onOpenInfo={openInfo}
      />
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

  return (
    <BookReader
      navigation={navigation}
      book={book}
      bookmarks={bookmarks}
      onToggleBookmark={toggleBookmark}
      settings={settings}
      initialIndex={initialIndex}
      onClose={closeBook}
    />
  );
}
