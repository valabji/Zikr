const { transformRawBook, joinEnglish } = require('../booksTransform');

describe('booksTransform', () => {
  it('joins narrator and text for object english', () => {
    expect(joinEnglish({ narrator: 'A said:', text: 'do good' })).toBe('A said: do good');
    expect(joinEnglish({ narrator: '', text: 'only text' })).toBe('only text');
    expect(joinEnglish('plain string')).toBe('plain string');
    expect(joinEnglish(null)).toBe('');
    expect(joinEnglish({})).toBe('');
  });

  it('normalizes hadiths into numbered entries', () => {
    const raw = {
      hadiths: [
        { idInBook: 1, arabic: ' نص عربي ', english: { narrator: 'N:', text: 'english one' } },
        { idInBook: 2, arabic: 'نص ثان', english: { narrator: '', text: '' } },
      ],
    };
    const { entries } = transformRawBook(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ n: 1, textAr: 'نص عربي', textEn: 'N: english one' });
    expect(entries[1]).toEqual({ n: 2, textAr: 'نص ثان' });
  });

  it('omits textEn when english is empty and skips empty arabic', () => {
    const raw = {
      hadiths: [
        { idInBook: 5, arabic: 'عربي فقط', english: { narrator: '', text: '' } },
        { idInBook: 6, arabic: '   ', english: { text: 'has english' } },
        { idInBook: 7, arabic: null },
      ],
    };
    const { entries } = transformRawBook(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({ n: 5, textAr: 'عربي فقط' });
  });

  it('falls back to id then index for the entry number', () => {
    const raw = {
      hadiths: [
        { id: 11, arabic: 'أ' },
        { arabic: 'ب' },
      ],
    };
    const { entries } = transformRawBook(raw);
    expect(entries[0].n).toBe(11);
    expect(entries[1].n).toBe(2);
  });

  it('returns empty entries for malformed input', () => {
    expect(transformRawBook(null)).toEqual({ entries: [] });
    expect(transformRawBook({})).toEqual({ entries: [] });
    expect(transformRawBook({ hadiths: 'nope' })).toEqual({ entries: [] });
  });
});
