import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBooksCatalog, getBookMeta, loadBook,
  normalizeArabic, searchBook,
  getLastRead, setLastRead,
  getBookmarks, setBookmarks,
} from '@/utils/books/BooksLibrary';

describe('BooksLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store = {};
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(store[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => { store[k] = v; return Promise.resolve(); });
  });

  it('exposes the bundled catalog', () => {
    const catalog = getBooksCatalog();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.map((b) => b.id)).toEqual(expect.arrayContaining(['nawawi40', 'riyad_assalihin']));
    expect(catalog.find((b) => b.id === 'qudsi40')).toBeUndefined();
  });

  it('getBookMeta returns metadata or null', () => {
    expect(getBookMeta('nawawi40').nameEn).toBe("An-Nawawi's 40 Hadith");
    expect(getBookMeta('does-not-exist')).toBeNull();
  });

  it('loadBook returns entries and caches the same instance', () => {
    const a = loadBook('nawawi40');
    expect(a).toBeTruthy();
    expect(a.entries.length).toBeGreaterThan(0);
    expect(a.entries[0]).toHaveProperty('n');
    expect(a.entries[0]).toHaveProperty('textAr');
    const b = loadBook('nawawi40');
    expect(b).toBe(a);
    expect(loadBook('nope')).toBeNull();
  });

  it('normalizeArabic strips diacritics and folds letters', () => {
    expect(normalizeArabic('الْأَعْمَالُ')).toBe('الاعمال');
    expect(normalizeArabic('عَلَىٰ')).toBe('علي');
    expect(normalizeArabic('نِيَّةٌ')).toBe('نيه');
  });

  it('searchBook finds Arabic matches by normalized term intersection', () => {
    const results = searchBook('nawawi40', 'الأعمال');
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((e) => {
      expect(normalizeArabic(e.textAr)).toContain('الاعمال');
    });
  });

  it('searchBook finds English matches by substring', () => {
    const results = searchBook('nawawi40', 'messenger');
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((e) => {
      expect((e.textEn || '').toLowerCase()).toContain('messenger');
    });
  });

  it('searchBook ignores queries shorter than 2 chars', () => {
    expect(searchBook('nawawi40', 'a')).toEqual([]);
    expect(searchBook('nawawi40', '')).toEqual([]);
  });

  it('persists and reads last-read position per book', async () => {
    expect(await getLastRead('nawawi40')).toBe(0);
    await setLastRead('nawawi40', 7);
    await setLastRead('qudsi40', 3);
    expect(await getLastRead('nawawi40')).toBe(7);
    expect(await getLastRead('qudsi40')).toBe(3);
  });

  it('persists and reads bookmarks per book', async () => {
    expect(await getBookmarks('nawawi40')).toEqual([]);
    await setBookmarks('nawawi40', [1, 4, 9]);
    expect(await getBookmarks('nawawi40')).toEqual([1, 4, 9]);
    expect(await getBookmarks('qudsi40')).toEqual([]);
  });
});
