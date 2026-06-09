import { RECITERS, getReciter, buildAyahAudioUrl, DEFAULT_RECITER_ID } from '../../constants/QuranReciters';

describe('QuranReciters', () => {
  it('contains reciters with required fields', () => {
    expect(RECITERS.length).toBeGreaterThanOrEqual(4);
    for (const r of RECITERS) {
      expect(r).toEqual(expect.objectContaining({
        id: expect.any(String),
        nameAr: expect.any(String),
        nameEn: expect.any(String),
        everyAyahSlug: expect.any(String),
      }));
    }
  });

  it('getReciter returns matching reciter or default', () => {
    expect(getReciter('alafasy').id).toBe('alafasy');
    expect(getReciter('nonexistent').id).toBe(RECITERS[0].id);
  });

  it('buildAyahAudioUrl pads to 3 digits and uses correct slug', () => {
    expect(buildAyahAudioUrl('alafasy', 1, 1)).toBe(
      'https://everyayah.com/data/Alafasy_128kbps/001001.mp3'
    );
    expect(buildAyahAudioUrl('husary', 114, 6)).toBe(
      'https://everyayah.com/data/Husary_128kbps/114006.mp3'
    );
  });

  it('falls back to default reciter for unknown ids', () => {
    expect(buildAyahAudioUrl('not-a-reciter', 2, 255))
      .toBe('https://everyayah.com/data/Alafasy_128kbps/002255.mp3');
  });

  it('exposes a sane default reciter id', () => {
    expect(RECITERS.some((r) => r.id === DEFAULT_RECITER_ID)).toBe(true);
  });
});
