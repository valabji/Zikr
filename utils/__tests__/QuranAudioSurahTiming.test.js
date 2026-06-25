import QuranAudio from '../QuranAudio';

const manifest = {
  surah: 1,
  audioUrl: 'x',
  duration: 100,
  verseTimings: [
    { ayah: 1, from: 0, to: 50, segments: [[1, 0, 10], [2, 10, 20], [3, 20, 30], [4, 30, 50]] },
    { ayah: 2, from: 50, to: 100, segments: [[1, 50, 60], [2, 60, 100]] },
  ],
};

describe('QuranAudio full-surah timing mapping', () => {
  beforeEach(() => {
    QuranAudio.surahManifest = manifest;
    QuranAudio._timingPtr = 0;
  });

  it('maps a playback position to the sounding ayah', () => {
    expect(QuranAudio._timingAt(5).ayah).toBe(1);
    expect(QuranAudio._timingAt(45).ayah).toBe(1);
    expect(QuranAudio._timingAt(55).ayah).toBe(2);
    expect(QuranAudio._timingAt(99).ayah).toBe(2);
  });

  it('handles backward seeks within the surah', () => {
    expect(QuranAudio._timingAt(80).ayah).toBe(2);
    expect(QuranAudio._timingAt(5).ayah).toBe(1);
  });

  it('maps position to a zero-based speakable word index', () => {
    const t = manifest.verseTimings[0];
    expect(QuranAudio._wordAt(t, 0)).toBe(0);
    expect(QuranAudio._wordAt(t, 15)).toBe(1);
    expect(QuranAudio._wordAt(t, 35)).toBe(3);
  });

  it('clamps the word index to the ayah word count', () => {
    const t = { ayah: 1, from: 0, to: 50, segments: [[99, 0, 50]] };
    expect(QuranAudio._wordAt(t, 25)).toBe(3);
  });
});
