import { getDailyHadith, _resetForTests } from '../DailyHadith';

describe('DailyHadith', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('returns a hadith with arabic text and source reference', () => {
    const hadith = getDailyHadith(new Date('2026-06-18T00:00:00.000Z'));
    expect(hadith).toBeTruthy();
    expect(typeof hadith.textAr).toBe('string');
    expect(hadith.textAr.length).toBeGreaterThan(0);
    expect(typeof hadith.bookId).toBe('string');
    expect(typeof hadith.n).toBe('number');
  });

  it('is deterministic for the same calendar day', () => {
    const a = getDailyHadith(new Date('2026-06-18T01:00:00.000Z'));
    const b = getDailyHadith(new Date('2026-06-18T23:00:00.000Z'));
    expect(a).toEqual(b);
  });

  it('changes across different days', () => {
    const day1 = getDailyHadith(new Date('2026-06-18T00:00:00.000Z'));
    const day2 = getDailyHadith(new Date('2026-06-19T00:00:00.000Z'));
    expect(day1).not.toEqual(day2);
  });

  it('cycles back to the same hadith after a full pool rotation', () => {
    const start = new Date('2026-06-18T00:00:00.000Z');
    const first = getDailyHadith(start);
    const poolSize = (() => {
      let i = 1;
      let cur = getDailyHadith(new Date(start.getTime() + i * 86400000));
      while (JSON.stringify(cur) !== JSON.stringify(first)) {
        i += 1;
        cur = getDailyHadith(new Date(start.getTime() + i * 86400000));
      }
      return i;
    })();
    const wrapped = getDailyHadith(new Date(start.getTime() + poolSize * 86400000));
    expect(wrapped).toEqual(first);
  });
});
