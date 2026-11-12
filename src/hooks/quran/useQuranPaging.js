import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { getLayoutOffsets } from '@/utils/quran/mushafLayout';
import { ayahPageForLayout } from '@/utils/quran/mushafIndex';
import { trackPage } from '@/utils/quran/ReadingProgress';

const { TOTAL_PAGES, STORAGE_KEYS } = QURAN_CONSTANTS;

export function useQuranPaging({ ready, isPaired, isContinuous, activeLayoutFile, fontScale, windowWidth, followAyahKey }) {
  const listRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [restoring, setRestoring] = React.useState(false);
  const restoreRef = React.useRef({ pending: false, target: 1, tries: 0 });
  const currentPageRef = React.useRef(1);

  const isPairedRef = React.useRef(isPaired);
  isPairedRef.current = isPaired;
  const isContinuousRef = React.useRef(isContinuous);
  isContinuousRef.current = isContinuous;

  const beginRestore = React.useCallback((page) => {
    const pending = page > 1;
    restoreRef.current = { pending, target: page, tries: 0 };
    setRestoring(pending);
  }, []);

  const persistLastPage = React.useCallback((page) => {
    AsyncStorage.setItem(STORAGE_KEYS.LAST_PAGE, String(page)).catch(() => {});
  }, []);

  const setInitialPage = React.useCallback((page) => {
    currentPageRef.current = page;
    setCurrentPage(page);
    beginRestore(page);
  }, [beginRestore]);

  const scrollToIndexForPage = React.useCallback((page, animated) => {
    const idx = isPairedRef.current ? Math.floor((page - 1) / 2) : page - 1;
    listRef.current?.scrollToIndex({ index: idx, animated });
  }, []);

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
        persistLastPage(page);
        trackPage(page);
      }
    },
  }]);

  const jumpToPage = React.useCallback((page) => {
    const target = Math.max(1, Math.min(TOTAL_PAGES, page));
    restoreRef.current.pending = false;
    setRestoring(false);
    scrollToIndexForPage(target, false);
    currentPageRef.current = target;
    setCurrentPage(target);
    persistLastPage(target);
  }, [persistLastPage, scrollToIndexForPage]);

  const attemptRestore = React.useCallback(() => {
    const r = restoreRef.current;
    if (!r.pending) return;
    r.tries += 1;
    if (r.tries > 10) {
      r.pending = false;
      setRestoring(false);
      return;
    }
    try {
      scrollToIndexForPage(r.target, false);
    } catch {}
  }, [scrollToIndexForPage]);

  const handleListLayout = React.useCallback(() => { attemptRestore(); }, [attemptRestore]);

  React.useEffect(() => {
    beginRestore(currentPageRef.current);
  }, [isContinuous, isPaired, beginRestore]);

  React.useEffect(() => {
    if (!ready || !restoring) return;
    const id = setInterval(attemptRestore, 350);
    return () => clearInterval(id);
  }, [ready, restoring, attemptRestore]);

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

  // Follows the playing/recited ayah across pages
  React.useEffect(() => {
    if (!ready || !followAyahKey) return;
    const page = ayahPageForLayout(activeLayoutFile, followAyahKey);
    if (!page || page === currentPageRef.current) return;
    currentPageRef.current = page;
    setCurrentPage(page);
    persistLastPage(page);
    try {
      scrollToIndexForPage(page, true);
    } catch {}
  }, [followAyahKey, ready, persistLastPage, activeLayoutFile, scrollToIndexForPage]);

  return {
    listRef,
    currentPage,
    restoring,
    setInitialPage,
    jumpToPage,
    persistLastPage,
    viewabilityConfigCallbackPairs,
    getItemLayout,
    offsetForIndex,
    handleListLayout,
  };
}
