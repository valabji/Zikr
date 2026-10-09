import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { pageAyahsForLayout } from '@/utils/quran/mushafIndex';

const { STORAGE_KEYS } = QURAN_CONSTANTS;

export function useQuranBookmarks(currentPage, activeLayoutFile) {
  const [bookmarks, setBookmarks] = React.useState([]);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setBookmarks(parsed.filter((b) => b && Number.isInteger(b.page) && b.page >= 1 && b.page <= QURAN_CONSTANTS.TOTAL_PAGES));
        }
      })
      .catch(() => {});
  }, []);

  const persist = React.useCallback((next) => {
    setBookmarks(next);
    AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next)).catch(() => {});
  }, []);

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleBookmark = React.useCallback(() => {
    const exists = bookmarks.some((b) => b.page === currentPage);
    const firstAyah = pageAyahsForLayout(activeLayoutFile, currentPage)[0];
    if (!exists && !firstAyah) return;
    persist(exists
      ? bookmarks.filter((b) => b.page !== currentPage)
      : [...bookmarks, {
          page: currentPage,
          surah: firstAyah.surah,
          ayah: firstAyah.ayah,
          addedAt: Date.now(),
        }]);
  }, [bookmarks, currentPage, activeLayoutFile, persist]);

  const removeBookmark = React.useCallback((page) => {
    persist(bookmarks.filter((b) => b.page !== page));
  }, [bookmarks, persist]);

  const updateBookmarkNote = React.useCallback((page, note) => {
    persist(bookmarks.map((b) => (b.page === page ? { ...b, note } : b)));
  }, [bookmarks, persist]);

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, updateBookmarkNote };
}
