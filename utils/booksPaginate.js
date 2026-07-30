const SCROLL_FRAME_HEIGHT = 32 + 44 + 16;
const PAGE_FRAME_HEIGHT = 58;

export function estimateEntryHeight(item, fontScale, showTranslation, containerWidth, frame = SCROLL_FRAME_HEIGHT) {
  const hasAr = !!item.textAr;
  const hasEn = !!item.textEn;
  const showEn = hasEn && (showTranslation || !hasAr);
  let height = frame;
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
}

export function paginateBook({ entries, chapters, pageHeight, fontScale, showTranslation, containerWidth }) {
  const hasChapters = Array.isArray(chapters) && chapters.length > 1;
  const chapterById = new Map();
  if (hasChapters) chapters.forEach((c) => chapterById.set(c.id, c));

  const pages = [];
  if (hasChapters) pages.push({ type: 'chapterIndex' });

  let bucket = [];
  let bucketHeight = 0;
  let bucketChapter = null;
  const flush = () => {
    if (!bucket.length) return;
    pages.push({ type: 'content', entries: bucket, chapter: bucketChapter });
    bucket = [];
    bucketHeight = 0;
  };

  let currentChapterId;
  entries.forEach((entry, index) => {
    if (hasChapters && entry.c !== currentChapterId) {
      flush();
      currentChapterId = entry.c;
      bucketChapter = chapterById.get(currentChapterId) || null;
      pages.push({ type: 'separator', chapter: bucketChapter });
    }
    const h = estimateEntryHeight(entry, fontScale, showTranslation, containerWidth, PAGE_FRAME_HEIGHT);
    if (bucket.length && bucketHeight + h > pageHeight) flush();
    bucket.push({ entry, index });
    bucketHeight += h;
  });
  flush();

  const entryToPage = new Array(entries.length).fill(0);
  const chapterToPage = new Map();
  const pageFirstEntry = new Array(pages.length).fill(0);
  pages.forEach((page, pi) => {
    if (page.type === 'content') {
      page.entries.forEach(({ index }) => { entryToPage[index] = pi; });
    } else if (page.type === 'separator' && page.chapter && !chapterToPage.has(page.chapter.id)) {
      chapterToPage.set(page.chapter.id, pi);
    }
  });

  let nextFirst = 0;
  for (let pi = pages.length - 1; pi >= 0; pi--) {
    const page = pages[pi];
    if (page.type === 'content' && page.entries.length) nextFirst = page.entries[0].index;
    pageFirstEntry[pi] = nextFirst;
  }

  return { pages, entryToPage, chapterToPage, pageFirstEntry };
}
