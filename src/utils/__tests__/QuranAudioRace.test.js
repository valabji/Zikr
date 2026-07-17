import { createAudioPlayer } from 'expo-audio';
import QuranAudio from '@/utils/quran/QuranAudio';
import { loadQuranSettings } from '@/utils/quran/QuranSettings';
import { getSurahAudioManifest } from '@/utils/quran/QuranSurahAudio';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/quran/QuranSettings', () => ({
  loadQuranSettings: jest.fn(() => Promise.resolve({
    reciterId: 'r1', audioPlaybackScope: 'ayah', loopEnabled: false, playbackRate: 1,
  })),
  subscribeQuranSettings: jest.fn(() => () => {}),
}));

jest.mock('@/utils/quran/QuranSurahAudio', () => ({ getSurahAudioManifest: jest.fn() }));

jest.mock('@/utils/quran/QuranSurahDownloader', () => ({
  __esModule: true,
  default: { getLocalAudioUri: jest.fn(() => Promise.resolve(null)) },
}));

jest.mock('@/utils/radio/RadioService', () => ({ __esModule: true, default: { stop: jest.fn() } }));

const flush = () => new Promise((resolve) => setImmediate(resolve));

const makePlayer = () => ({
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setPlaybackRate: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  playing: false,
  currentStatus: { isLoaded: true, playing: false, playbackState: 'readyToPlay' },
});

const surahManifest = {
  surah: 1,
  audioUrl: 'http://x/1.mp3',
  verseTimings: [
    { ayah: 1, from: 0, to: 500, segments: [] },
    { ayah: 2, from: 500, to: 1000, segments: [] },
  ],
};

describe('QuranAudio play race conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSurahAudioManifest.mockResolvedValue(null);
    createAudioPlayer.mockImplementation(() => makePlayer());
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'ayah', loopEnabled: false, playbackRate: 1,
    });
    QuranAudio._clearWatchdog();
    QuranAudio.player = null;
    QuranAudio._statusSub = null;
    QuranAudio.activeAyah = null;
    QuranAudio.isPlaying = false;
    QuranAudio.unsubSettings = null;
    QuranAudio.playbackScope = 'ayah';
    QuranAudio.mode = 'ayah';
    QuranAudio.surahManifest = null;
    QuranAudio._opId = 0;
    QuranAudio._preload = null;
    QuranAudio.listeners.clear();
  });

  it('a second ayah supersedes the first before it creates a player (no orphan)', async () => {
    const p1 = QuranAudio.playAyah(1, 1);
    const p2 = QuranAudio.playAyah(1, 2);
    await Promise.all([p1, p2]);

    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    const player = createAudioPlayer.mock.results[0].value;
    expect(QuranAudio.player).toBe(player);
    expect(player.play).toHaveBeenCalled();
    expect(QuranAudio.activeAyah).toEqual({ surah: 1, ayah: 2 });

    await QuranAudio.stop();
    expect(player.pause).toHaveBeenCalled();
    expect(player.remove).toHaveBeenCalled();
    expect(QuranAudio.player).toBeNull();
  });

  it('a gapless play of another surah during seek removes the first player and never plays it', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockImplementation((reciter, surah) => Promise.resolve({ ...surahManifest, surah }));
    const created = [];
    const gate = [];
    createAudioPlayer.mockImplementation(() => {
      const player = makePlayer();
      player.seekTo = jest.fn(() => new Promise((resolve) => { gate.push(resolve); }));
      created.push(player);
      return player;
    });

    const p1 = QuranAudio.playAyah(1, 1);
    await flush();
    const p2 = QuranAudio.playAyah(2, 1);
    await flush();
    gate.forEach((resolve) => resolve());
    await Promise.all([p1, p2]);

    expect(created).toHaveLength(2);
    expect(created[0].remove).toHaveBeenCalled();
    expect(created[0].pause.mock.invocationCallOrder[0])
      .toBeLessThan(created[0].remove.mock.invocationCallOrder[0]);
    expect(created[0].play).not.toHaveBeenCalled();
    expect(created[1].play).toHaveBeenCalled();
    expect(QuranAudio.player).toBe(created[1]);
  });

  it('tapping another ayah of the loaded surah seeks in place instead of rebuilding', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockResolvedValue(surahManifest);

    await QuranAudio.playAyah(1, 1);
    const player = QuranAudio.player;
    await QuranAudio.playAyah(1, 2);

    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(QuranAudio.player).toBe(player);
    expect(player.pause).not.toHaveBeenCalled();
    expect(player.remove).not.toHaveBeenCalled();
    expect(player.seekTo).toHaveBeenLastCalledWith(0.5, 0, 0);
    expect(QuranAudio.activeAyah).toEqual({ surah: 1, ayah: 2 });
  });

  it('double-tapping the same ayah in gapless mode never creates a second player', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockResolvedValue(surahManifest);

    await QuranAudio.playAyah(1, 1);
    const player = QuranAudio.player;
    await QuranAudio.playAyah(1, 1);

    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(QuranAudio.player).toBe(player);
    expect(player.remove).not.toHaveBeenCalled();
    expect(player.seekTo).toHaveBeenLastCalledWith(0, 0, 0);
    expect(QuranAudio.activeAyah).toEqual({ surah: 1, ayah: 1 });
  });

  it('per-ayah continuous playback preloads the next ayah and swaps it in without recreating', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockResolvedValue(null);

    await QuranAudio.playAyah(1, 1);
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
    const first = createAudioPlayer.mock.results[0].value;
    const preloaded = createAudioPlayer.mock.results[1].value;
    expect(QuranAudio.player).toBe(first);
    expect(preloaded.play).not.toHaveBeenCalled();

    const statusCb = first.addListener.mock.calls[0][1];
    statusCb({ didJustFinish: true });
    await flush();

    expect(QuranAudio.player).toBe(preloaded);
    expect(preloaded.play).toHaveBeenCalled();
    expect(QuranAudio.activeAyah).toEqual({ surah: 1, ayah: 2 });
    expect(createAudioPlayer).toHaveBeenCalledTimes(3);
  });

  it('stop supersedes an in-flight gapless play so its player never starts', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    getSurahAudioManifest.mockResolvedValue(surahManifest);
    let releaseSeek;
    let player;
    createAudioPlayer.mockImplementationOnce(() => {
      player = makePlayer();
      player.seekTo = jest.fn(() => new Promise((resolve) => { releaseSeek = resolve; }));
      return player;
    });

    const playing = QuranAudio.playAyah(1, 1);
    await flush();
    await QuranAudio.stop();
    releaseSeek();
    await playing;

    expect(player.remove).toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();
    expect(QuranAudio.player).toBeNull();
    expect(QuranAudio.activeAyah).toBeNull();
  });

  it('a stale gapless play resolving late does not unload the newer player', async () => {
    loadQuranSettings.mockResolvedValue({
      reciterId: 'r1', audioPlaybackScope: 'surah', loopEnabled: false, playbackRate: 1,
    });
    let releaseManifest;
    getSurahAudioManifest.mockImplementationOnce(() => new Promise((resolve) => {
      releaseManifest = () => resolve(surahManifest);
    }));

    const p1 = QuranAudio.playAyah(1, 1);
    await flush();
    QuranAudio.playbackScope = 'ayah';
    const p2 = QuranAudio.playAyah(2, 1);
    await p2;
    const player2 = QuranAudio.player;
    expect(player2.play).toHaveBeenCalled();

    releaseManifest();
    await p1;

    expect(player2.remove).not.toHaveBeenCalled();
    expect(QuranAudio.player).toBe(player2);
    expect(QuranAudio.activeAyah).toEqual({ surah: 2, ayah: 1 });
  });

  it('a failed load removes the player and reports not playing', async () => {
    jest.useFakeTimers();
    const player = makePlayer();
    player.currentStatus = { isLoaded: false, playing: false, playbackState: 'failed' };
    createAudioPlayer.mockImplementationOnce(() => player);

    await QuranAudio.playAyah(1, 1);
    expect(QuranAudio.isPlaying).toBe(true);

    jest.advanceTimersByTime(500);
    expect(player.remove).toHaveBeenCalled();
    expect(QuranAudio.player).toBeNull();
    expect(QuranAudio.isPlaying).toBe(false);
    jest.useRealTimers();
  });

  it('the load watchdog stops polling once the player is loaded', async () => {
    jest.useFakeTimers();
    await QuranAudio.playAyah(1, 1);
    const player = QuranAudio.player;

    jest.advanceTimersByTime(2000);
    expect(player.remove).not.toHaveBeenCalled();
    expect(QuranAudio.player).toBe(player);
    expect(QuranAudio._watchdog).toBeNull();
    jest.useRealTimers();
  });
});
