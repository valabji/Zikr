import { normalizeArabic, tokenize, matchPosition, findResync } from '../../utils/quranRecitationMatch';

const flat = (...norms) => norms.map((norm) => ({ norm }));

describe('normalizeArabic', () => {
  it('strips tashkeel and tatweel', () => {
    expect(normalizeArabic('ٱلْحَمْدُ')).toBe('الحمد');
    expect(normalizeArabic('رَبِّ')).toBe('رب');
  });

  it('folds alef, ya, ta-marbuta and hamza variants', () => {
    expect(normalizeArabic('أإآ')).toBe('ااا');
    expect(normalizeArabic('على')).toBe('علي');
    expect(normalizeArabic('صلاة')).toBe('صلاه');
  });

  it('drops non-Arabic characters and collapses spaces', () => {
    expect(normalizeArabic('  الله 123 !!  ')).toBe('الله');
  });
});

describe('tokenize', () => {
  it('splits normalized text into words', () => {
    expect(tokenize('بِسْمِ ٱللَّهِ')).toEqual(['بسم', 'الله']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('123')).toEqual([]);
  });
});

describe('matchPosition', () => {
  const words = flat('بسم', 'الله', 'الرحمن', 'الرحيم', 'الحمد', 'لله', 'رب', 'العلمين');

  it('returns fromPos when nothing matches', () => {
    expect(matchPosition(words, 2, ['xyz'])).toBe(2);
  });

  it('finds a single recognized word ahead of the cursor', () => {
    expect(matchPosition(words, 0, ['الرحيم'])).toBe(3);
  });

  it('prefers the longest trailing-token alignment', () => {
    expect(matchPosition(words, 0, ['الحمد', 'لله', 'رب'])).toBe(6);
  });

  it('never moves backward', () => {
    expect(matchPosition(words, 5, ['بسم'])).toBe(5);
  });

  it('matches across alef orthography via skeleton fallback', () => {
    expect(matchPosition(words, 4, ['العالمين'])).toBe(7);
  });

  it('respects the lookahead window', () => {
    expect(matchPosition(words, 0, ['العلمين'], 3)).toBe(0);
    expect(matchPosition(words, 0, ['العلمين'], 8)).toBe(7);
  });
});

describe('findResync', () => {
  const words = flat('بسم', 'الله', 'الرحمن', 'الرحيم', 'الحمد', 'لله', 'رب', 'العلمين', 'الحمد', 'لله', 'الذي');

  it('jumps forward to the closest run of recited words', () => {
    expect(findResync(words, 6, ['الحمد', 'لله'])).toBe(9);
  });

  it('picks the nearest occurrence when several exist ahead', () => {
    expect(findResync(words, 0, ['الحمد', 'لله'])).toBe(5);
  });

  it('refuses to jump on a single common word', () => {
    expect(findResync(words, 0, ['الله'])).toBe(-1);
  });

  it('returns -1 when no confident run is found', () => {
    expect(findResync(words, 0, ['xyz', 'abc'])).toBe(-1);
  });

  it('respects the search range', () => {
    expect(findResync(words, 0, ['الحمد', 'لله'], 3)).toBe(-1);
  });
});
