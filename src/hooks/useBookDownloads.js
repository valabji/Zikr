import { useState, useEffect, useCallback } from 'react';
import BooksDownloader from '@/utils/BooksDownloader';

export function useBookDownloads(catalog) {
  const [dlState, setDlState] = useState({});

  useEffect(() => {
    BooksDownloader.checkInstalled(catalog.filter((b) => !b.bundled).map((b) => b.id));
    return BooksDownloader.subscribe(setDlState);
  }, [catalog]);

  const isReady = useCallback(
    (item) => item.bundled || !!(dlState[item.id] && dlState[item.id].installed),
    [dlState]
  );

  return { dlState, isReady };
}
