import {
  normalizeArabicQuery,
  isArabicQuery,
  editDistanceWithinOne,
  searchArabicIndex,
  buildEnglishIndex,
  searchEnglishIndex,
} from '@/utils/quran/quranSearch';

describe('normalizeArabicQuery', () => {
  it('strips tashkeel and tatweel', () => {
    expect(normalizeArabicQuery('ٱلْحَمْدُ')).toBe('الحمد');
  });

  it('folds alef and ya variants, and ta-marbuta, but keeps hamza forms', () => {
    expect(normalizeArabicQuery('أإآ')).toBe('ااا');
    expect(normalizeArabicQuery('على')).toBe('علي');
    expect(normalizeArabicQuery('صلاة')).toBe('صلاه');
    expect(normalizeArabicQuery('يؤمنون')).toBe('يؤمنون');
  });

  it('drops non-Arabic characters and collapses spaces', () => {
    expect(normalizeArabicQuery('  الله 123 !!  ')).toBe('الله');
  });
});

describe('isArabicQuery', () => {
  it('detects Arabic text', () => {
    expect(isArabicQuery('الرحمن')).toBe(true);
  });

  it('detects non-Arabic (Latin) text', () => {
    expect(isArabicQuery('mercy')).toBe(false);
  });
});

describe('editDistanceWithinOne', () => {
  it('returns true for identical words', () => {
    expect(editDistanceWithinOne('الرحمن', 'الرحمن')).toBe(true);
  });

  it('returns true for a single substitution', () => {
    expect(editDistanceWithinOne('الرحمن', 'الرحمز')).toBe(true);
  });

  it('returns true for a single insertion/deletion', () => {
    expect(editDistanceWithinOne('الرحمن', 'الرحمان')).toBe(true);
  });

  it('returns false when more than one edit is needed', () => {
    expect(editDistanceWithinOne('الرحمن', 'العليم')).toBe(false);
  });

  it('returns false when length differs by more than one', () => {
    expect(editDistanceWithinOne('ا', 'الرحمن')).toBe(false);
  });
});

describe('searchArabicIndex', () => {
  const index = {
    بسم: ['1:1'],
    الله: ['1:1', '1:2'],
    الرحمن: ['1:1', '1:3'],
    الرحيم: ['1:1', '1:3'],
    رحمة: ['2:5'],
  };

  it('matches by substring across a single term', () => {
    const keys = searchArabicIndex('بسم', index);
    expect(keys.sort()).toEqual(['1:1']);
  });

  it('intersects results across multiple terms', () => {
    const keys = searchArabicIndex('الله الرحمن', index);
    expect(keys.sort()).toEqual(['1:1']);
  });

  it('returns empty for terms shorter than 2 letters', () => {
    expect(searchArabicIndex('ا', index)).toEqual([]);
  });

  it('fuzzy-matches a near-miss spelling for longer terms', () => {
    const keys = searchArabicIndex('الرحمز', index);
    expect(keys.sort()).toEqual(['1:1', '1:3']);
  });

  it('respects the limit parameter', () => {
    const keys = searchArabicIndex('الله', index, 1);
    expect(keys).toHaveLength(1);
  });
});

describe('buildEnglishIndex / searchEnglishIndex', () => {
  const translations = {
    '1:1': 'In the name of Allah, the Beneficent, the Merciful.',
    '1:3': 'The Beneficent, the Merciful.',
    '2:5': 'These depend on guidance from their Lord.',
  };
  const index = buildEnglishIndex(translations);

  it('indexes meaningful words, skipping stop words and short tokens', () => {
    expect(index.beneficent).toEqual(['1:1', '1:3']);
    expect(index.the).toBeUndefined();
    expect(index.in).toBeUndefined();
  });

  it('finds verses by whole-word meaning match', () => {
    const keys = searchEnglishIndex('merciful', index);
    expect(keys.sort()).toEqual(['1:1', '1:3']);
  });

  it('matches by prefix', () => {
    const keys = searchEnglishIndex('guid', index);
    expect(keys).toEqual(['2:5']);
  });

  it('intersects across multiple terms', () => {
    const keys = searchEnglishIndex('name allah', index);
    expect(keys).toEqual(['1:1']);
  });

  it('returns empty when no terms survive stop-word filtering', () => {
    expect(searchEnglishIndex('the and', index)).toEqual([]);
  });
});
