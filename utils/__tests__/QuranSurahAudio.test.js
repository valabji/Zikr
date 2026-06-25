import { getSurahAudioManifest, getReciterQdcId } from '../QuranSurahAudio';

describe('QuranSurahAudio', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('returns the qdc id only for reciters that have gapless audio', () => {
    expect(getReciterQdcId('alafasy')).toBe(7);
    expect(getReciterQdcId('maher')).toBeNull();
  });

  it('returns null without fetching for reciters lacking gapless audio', async () => {
    global.fetch = jest.fn();
    const manifest = await getSurahAudioManifest('maher', 36);
    expect(manifest).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and normalizes the qdc audio file into a manifest', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        audio_files: [{
          audio_url: 'https://cdn/108.mp3',
          duration: 9000,
          verse_timings: [
            { verse_key: '108:1', timestamp_from: 0, timestamp_to: 3000, segments: [[1, 0, 1500], [2, 1500, 3000]] },
            { verse_key: '108:2', timestamp_from: 3000, timestamp_to: 6000, segments: [[1, 3000, 6000]] },
          ],
        }],
      }),
    }));
    const manifest = await getSurahAudioManifest('alafasy', 108);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(manifest.audioUrl).toBe('https://cdn/108.mp3');
    expect(manifest.verseTimings).toHaveLength(2);
    expect(manifest.verseTimings[0]).toMatchObject({ ayah: 1, from: 0, to: 3000 });
    expect(manifest.verseTimings[1].ayah).toBe(2);
    expect(manifest.verseTimings[0].segments[1]).toEqual([2, 1500, 3000]);
  });

  it('returns null when the qdc response has no audio file', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ audio_files: [] }) }));
    const manifest = await getSurahAudioManifest('husary', 109);
    expect(manifest).toBeNull();
  });

  it('returns null on a failed request', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    const manifest = await getSurahAudioManifest('sudais', 110);
    expect(manifest).toBeNull();
  });
});
