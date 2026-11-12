import * as React from 'react';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { pageAyahsForLayout } from '@/utils/quran/mushafIndex';
import { createProgressStore } from '@/utils/createProgressStore';

const store = createProgressStore(QURAN_CONSTANTS.STORAGE_KEYS.BOOKMARKS, () => [], parsed => (
  Array.isArray(parsed)
    ? parsed.filter(b => b && Number.isInteger(b.page) && b.page >= 1 && b.page <= QURAN_CONSTANTS.TOTAL_PAGES)
    : []
));

export const _resetForTests = store.reset;

export function useQuranBookmarks(currentPage, activeLayoutFile) {
  const [bookmarks, setBookmarks] = React.useState(store.getCached);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setBookmarks);
    let mounted = true;
    store.load().then(state => { if (mounted) setBookmarks(state); });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const isBookmarked = bookmarks.some(b => b.page === currentPage);

  const toggleBookmark = React.useCallback(() => {
    const exists = store.getCached().some(b => b.page === currentPage);
    const firstAyah = pageAyahsForLayout(activeLayoutFile, currentPage)[0];
    if (!firstAyah && !exists) return;
    const addedAt = Date.now();
    store.update(current => {
      if (exists) return current.filter(b => b.page !== currentPage);
      if (current.some(b => b.page === currentPage)) return current;
      return [...current, { page: currentPage, surah: firstAyah.surah, ayah: firstAyah.ayah, addedAt }];
    });
  }, [currentPage, activeLayoutFile]);

  const removeBookmark = React.useCallback(page => {
    store.update(current => current.filter(b => b.page !== page));
  }, []);

  const updateBookmarkNote = React.useCallback((page, note) => {
    store.update(current => current.map(b => b.page === page ? { ...b, note } : b));
  }, []);

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, updateBookmarkNote };
}
