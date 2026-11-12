import QuranAudio from '@/utils/quran/QuranAudio';
import pagesData from '@assets/quran/data/pages.json';

const surahManifest = (surah, ayahCount) => ({
  surah,
  verseTimings: Array.from({ length: ayahCount }, (_, i) => ({ ayah: i + 1 })),
});

describe('QuranAudio gapless scope helpers', () => {
  it('resolves the page number for an ayah', () => {
    expect(QuranAudio._pageOf(1, 1)).toBe(1);
    expect(QuranAudio._pageOf(2, 1)).toBe(2);
  });

  it('caps the page segment end at the last page ayah within the surah', () => {
    QuranAudio.gaplessPage = 1;
    const fatiha = surahManifest(1, 7);
    expect(QuranAudio._segEndAyah(fatiha, 'page')).toBe(7);
    expect(QuranAudio._segEndAyah(fatiha, 'surah')).toBe(7);

    QuranAudio.gaplessPage = 2;
    const page2 = pagesData[1];
    const lastOnPage2 = Math.max(...page2.ayahs.filter((a) => a.surah === 2).map((a) => a.ayah));
    const baqara = surahManifest(2, 286);
    expect(QuranAudio._segEndAyah(baqara, 'page')).toBe(lastOnPage2);
    expect(QuranAudio._segEndAyah(baqara, 'surah')).toBe(286);
  });

  it('walks to the next surah on a page that spans a surah boundary', () => {
    const multi = pagesData.find((pg) => new Set(pg.ayahs.map((a) => a.surah)).size > 1);
    expect(multi).toBeTruthy();
    QuranAudio.gaplessPage = multi.page;
    const firstSurah = multi.ayahs[0].surah;
    const lastOfFirst = Math.max(...multi.ayahs.filter((a) => a.surah === firstSurah).map((a) => a.ayah));
    const nextAyah = QuranAudio._nextPageAyah(firstSurah, lastOfFirst);
    expect(nextAyah).toBeTruthy();
    expect(nextAyah.surah).not.toBe(firstSurah);
  });

  it('returns null when the page stays inside one surah', () => {
    QuranAudio.gaplessPage = 1;
    expect(QuranAudio._nextPageAyah(1, 7)).toBeNull();
  });
});
