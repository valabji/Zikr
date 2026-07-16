import { cleanForHafs, ayahLayoutWords, toArabicDigits } from '@/utils/mushafLayout';

describe('cleanForHafs', () => {
  it('converts (n) ayah markers to Arabic-Indic digits', () => {
    expect(cleanForHafs('الٓمٓ (1) تَنزِيلُ')).toBe('الٓمٓ ١ تَنزِيلُ');
    expect(cleanForHafs('a (12) b (3)')).toBe('a ١٢ b ٣');
  });

  it('strips stray parentheses Hafs cannot render', () => {
    expect(cleanForHafs('(x)')).toBe('x');
    expect(cleanForHafs(')(')).toBe('');
  });

  it('passes through falsy input unchanged', () => {
    expect(cleanForHafs('')).toBe('');
    expect(cleanForHafs(undefined)).toBeUndefined();
    expect(cleanForHafs(null)).toBeNull();
  });
});

describe('ayahLayoutWords', () => {
  it('returns ordered words with page and code for a known verse', () => {
    const words = ayahLayoutWords('pages_lines_v2', '32:1');
    expect(words).toEqual([
      { page: 415, code: 'ﱁ', ar: 'الٓمٓ', type: 'word' },
      { page: 415, code: 'ﱂ', ar: '١', type: 'end' },
    ]);
  });

  it('every word carries a glyph code usable by a QCF page font', () => {
    const words = ayahLayoutWords('pages_lines_v2', '2:255');
    expect(words.length).toBeGreaterThan(0);
    words.forEach((w) => {
      expect(typeof w.code).toBe('string');
      expect(w.code.length).toBeGreaterThan(0);
      expect(typeof w.page).toBe('number');
    });
  });

  it('returns an empty array for an unknown verse key', () => {
    expect(ayahLayoutWords('pages_lines_v2', '999:1')).toEqual([]);
  });
});

describe('toArabicDigits', () => {
  it('maps ASCII digits to Arabic-Indic', () => {
    expect(toArabicDigits(2024)).toBe('٢٠٢٤');
    expect(toArabicDigits('1:7')).toBe('١:٧');
  });
});
