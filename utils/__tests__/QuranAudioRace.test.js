import { Audio } from 'expo-av';
import QuranAudio from '../QuranAudio';
import { loadQuranSettings } from '../QuranSettings';
import { getSurahAudioManifest } from '../QuranSurahAudio';

jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn() },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../QuranSettings', () => ({
  loadQuranSettings: jest.fn(() => Promise.resolve({
    reciterId: 'r1', audioPlaybackScope: 'ayah', loopEnabled: false, playbackRate: 1,
  })),
  subscribeQuranSettings: jest.fn(() => () => {}),
}));

jest.mock('../QuranSurahAudio', () => ({ getSurahAudioManifest: jest.fn() }));

jest.mock('../QuranSurahDownloader', () => ({
  __esModule: true,
  default: { getLocalAudioUri: jest.fn(() => Promise.resolve(null)) },
}));

jest.mock('../RadioService', () => ({ __esModule: true, default: { stop: jest.fn() } }));

const flush = () => new Promise((resolve) => setImmediate(resolve));

const makeSound = () => ({
  playAsync: jest.fn(() => Promise.resolve()),
  pauseAsync: jest.fn(() => Promise.resolve()),
  unloadAsync: jest.fn(() => Promise.resolve()),
  getStatusAsync: jest.fn(() => Promise.resolve({ isLoaded: true, isPlaying: true })),
  setRateAsync: jest.fn(() => Promise.resolve()),
  setPositionAsync: jest.fn(() => Promise.resolve()),
  setOnPlaybackStatusUpdate: jest.fn(),
});

describe('QuranAudio play race conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSurahAudioManifest.mockResolvedValue(null);
    Audio.Sound.createAsync.mockImplementation(() => Promise.resolve({ sound: makeSound() }));
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'ayah', loopEnabled: false, playbackRate: 1,
    });
    QuranAudio.sound = null;
    QuranAudio.activeAyah = null;
    QuranAudio.isPlaying = false;
    QuranAudio.audioModeReady = false;
    QuranAudio.unsubSettings = null;
    QuranAudio.playbackScope = 'ayah';
    QuranAudio._opId = 0;
    QuranAudio.listeners.clear();
  });

  it('a second ayah during load unloads the first sound (no orphan)', async () => {
    const created = [];
    const gate = [];
    Audio.Sound.createAsync.mockImplementation(() => new Promise((resolve) => {
      const sound = makeSound();
      created.push(sound);
      gate.push(() => resolve({ sound }));
    }));

    const p1 = QuranAudio.playAyah(1, 1);
    await flush();
    const p2 = QuranAudio.playAyah(1, 2);
    await flush();
    gate[0]();
    gate[1]();
    await Promise.all([p1, p2]);

    expect(created).toHaveLength(2);
    expect(created[0].unloadAsync).toHaveBeenCalled();
    expect(QuranAudio.sound).toBe(created[1]);

    await QuranAudio.stop();
    expect(created[1].unloadAsync).toHaveBeenCalled();
    expect(QuranAudio.sound).toBeNull();
  });

  it('a second gapless play during load unloads the first sound', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockResolvedValue({
      surah: 1,
      audioUrl: 'http://x/1.mp3',
      verseTimings: [
        { ayah: 1, from: 0, to: 500, segments: [] },
        { ayah: 2, from: 500, to: 1000, segments: [] },
      ],
    });
    const created = [];
    const gate = [];
    Audio.Sound.createAsync.mockImplementation(() => new Promise((resolve) => {
      const sound = makeSound();
      created.push(sound);
      gate.push(() => resolve({ sound }));
    }));

    const p1 = QuranAudio.playAyah(1, 1);
    await flush();
    const p2 = QuranAudio.playAyah(1, 1);
    await flush();
    gate[0]();
    gate[1]();
    await Promise.all([p1, p2]);

    expect(created).toHaveLength(2);
    expect(created[0].unloadAsync).toHaveBeenCalled();
    expect(QuranAudio.sound).toBe(created[1]);
  });

  it('stop supersedes an in-flight ayah so its sound never leaks', async () => {
    let resolveCreate;
    let leaked;
    Audio.Sound.createAsync.mockImplementationOnce(() => new Promise((resolve) => {
      leaked = makeSound();
      resolveCreate = () => resolve({ sound: leaked });
    }));

    const playing = QuranAudio.playAyah(1, 1);
    await flush();
    await QuranAudio.stop();
    resolveCreate();
    await playing;

    expect(leaked.unloadAsync).toHaveBeenCalled();
    expect(QuranAudio.sound).toBeNull();
    expect(QuranAudio.activeAyah).toBeNull();
  });
});
