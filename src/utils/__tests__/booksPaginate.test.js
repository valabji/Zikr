import { paginateBook, estimateEntryHeight } from '@/utils/booksPaginate';

describe('estimateEntryHeight', () => {
  it('grows with translation and longer text', () => {
    const arOnly = { n: 1, textAr: 'نص', textEn: 'translation here' };
    const base = estimateEntryHeight(arOnly, 1, false, 300);
    const withTr = estimateEntryHeight(arOnly, 1, true, 300);
    expect(withTr).toBeGreaterThan(base);

    const short = estimateEntryHeight({ n: 1, textAr: 'أ' }, 1, false, 300);
    const long = estimateEntryHeight({ n: 1, textAr: 'أ'.repeat(400) }, 1, false, 300);
    expect(long).toBeGreaterThan(short);
  });
});

describe('paginateBook', () => {
  it('packs entries into content pages with no chapters', () => {
    const entries = [
      { n: 1, textAr: 'أ' },
      { n: 2, textAr: 'ب' },
      { n: 3, textAr: 'ج' },
    ];
    const { pages, entryToPage, chapterToPage } = paginateBook({
      entries,
      chapters: [],
      pageHeight: 100,
      fontScale: 1,
      showTranslation: false,
      containerWidth: 300,
    });
    expect(pages).toHaveLength(3);
    expect(pages.every((p) => p.type === 'content')).toBe(true);
    expect(entryToPage).toEqual([0, 1, 2]);
    expect(chapterToPage.size).toBe(0);
  });

  it('emits an index page, separators, and chapter maps when chaptered', () => {
    const entries = [
      { n: 1, textAr: 'أ', c: 1 },
      { n: 2, textAr: 'ب', c: 1 },
      { n: 3, textAr: 'ج', c: 2 },
    ];
    const chapters = [
      { id: 1, ar: 'الأول', en: 'One' },
      { id: 2, ar: 'الثاني', en: 'Two' },
    ];
    const { pages, entryToPage, chapterToPage, pageFirstEntry } = paginateBook({
      entries,
      chapters,
      pageHeight: 4000,
      fontScale: 1,
      showTranslation: false,
      containerWidth: 300,
    });
    expect(pages.map((p) => p.type)).toEqual([
      'chapterIndex', 'separator', 'content', 'separator', 'content',
    ]);
    expect(pages[2].entries.map((e) => e.index)).toEqual([0, 1]);
    expect(pages[4].entries.map((e) => e.index)).toEqual([2]);
    expect(entryToPage).toEqual([2, 2, 4]);
    expect(chapterToPage.get(1)).toBe(1);
    expect(chapterToPage.get(2)).toBe(3);
    expect(pageFirstEntry).toEqual([0, 0, 0, 2, 2]);
  });
});
