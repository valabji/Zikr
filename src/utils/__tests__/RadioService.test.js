import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadioService from '@/utils/RadioService';
import QuranAudio from '@/utils/QuranAudio';
import Sounds from '@/utils/Sounds';
import { RADIO_CONSTANTS } from '@/constants/RadioConstants';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

const mockState = { lastSound: null };
const mockMakeSound = () => {
  const sound = {
    cb: null,
    playAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    unloadAsync: jest.fn(() => Promise.resolve()),
    getStatusAsync: jest.fn(() => Promise.resolve({ isLoaded: true, isPlaying: true })),
    setOnPlaybackStatusUpdate: jest.fn((cb) => { sound.cb = cb; }),
  };
  mockState.lastSound = sound;
  return sound;
};

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ sound: mockMakeSound() })),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
  InterruptionModeIOS: { MixWithOthers: 0, DoNotMix: 1, DuckOthers: 2 },
}));

jest.mock('@/utils/QuranAudio', () => ({
  __esModule: true,
  default: { stop: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/Sounds', () => ({
  __esModule: true,
  default: { stopFullAdhan: jest.fn(() => Promise.resolve()) },
}));

const station = { id: 3, name: 'Test Radio', streamUrl: 'https://stream.example/3' };
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('RadioService', () => {
  let store;
  beforeEach(() => {
    jest.clearAllMocks();
    Audio.Sound.createAsync.mockImplementation(() => Promise.resolve({ sound: mockMakeSound() }));
    mockState.lastSound = null;
    store = {};
    AsyncStorage.setItem.mockImplementation((k, v) => { store[k] = v; return Promise.resolve(); });
    RadioService.sound = null;
    RadioService.activeStation = null;
    RadioService.isPlaying = false;
    RadioService.isBuffering = false;
    RadioService.failedStationId = null;
    RadioService.audioModeReady = false;
    RadioService.listeners.clear();
  });

  it('subscribe immediately emits current state and returns an unsubscribe', () => {
    const fn = jest.fn();
    const unsub = RadioService.subscribe(fn);
    expect(fn).toHaveBeenCalledWith({ activeStation: null, isPlaying: false, isBuffering: false, failedStationId: null });
    expect(RadioService.listeners.size).toBe(1);
    unsub();
    expect(RadioService.listeners.size).toBe(0);
  });

  it('playStation sets the audio mode, stops Quran, plays, and persists last played', async () => {
    await RadioService.playStation(station);
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }));
    expect(QuranAudio.stop).toHaveBeenCalled();
    expect(Sounds.stopFullAdhan).toHaveBeenCalled();
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: station.streamUrl },
      { shouldPlay: true },
    );
    expect(RadioService.activeStation).toEqual(station);
    expect(RadioService.isPlaying).toBe(true);
    expect(JSON.parse(store[STORAGE_KEYS.LAST_PLAYED])).toEqual(station);
  });

  it('ignores a station with no stream url', async () => {
    await RadioService.playStation({ id: 1, name: 'No URL' });
    expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    expect(RadioService.activeStation).toBeNull();
  });

  it('switching stations unloads the previous sound', async () => {
    await RadioService.playStation(station);
    const first = mockState.lastSound;
    await RadioService.playStation({ id: 4, name: 'Second', streamUrl: 'https://stream.example/4' });
    expect(first.setOnPlaybackStatusUpdate).toHaveBeenCalledWith(null);
    expect(first.unloadAsync).toHaveBeenCalled();
    expect(RadioService.activeStation.id).toBe(4);
  });

  it('playback status updates flow to subscribers', async () => {
    await RadioService.playStation(station);
    const fn = jest.fn();
    RadioService.subscribe(fn);
    fn.mockClear();
    mockState.lastSound.cb({ isLoaded: true, isPlaying: false, isBuffering: true });
    expect(RadioService.isBuffering).toBe(true);
    expect(RadioService.isPlaying).toBe(false);
    expect(fn).toHaveBeenCalledWith({ activeStation: station, isPlaying: false, isBuffering: true, failedStationId: null });
  });

  it('toggle pauses when playing and resumes when paused', async () => {
    await RadioService.playStation(station);
    const sound = mockState.lastSound;
    sound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: true });
    await RadioService.toggle();
    expect(sound.pauseAsync).toHaveBeenCalled();
    expect(RadioService.isPlaying).toBe(false);

    sound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: false });
    await RadioService.toggle();
    expect(sound.playAsync).toHaveBeenCalled();
    expect(RadioService.isPlaying).toBe(true);
  });

  it('a second play during load unloads the first sound (no orphan)', async () => {
    const created = [];
    const gate = [];
    Audio.Sound.createAsync.mockImplementation(() => new Promise((resolve) => {
      const sound = mockMakeSound();
      created.push(sound);
      gate.push(() => resolve({ sound }));
    }));

    const p1 = RadioService.playStation(station);
    await flush();
    const p2 = RadioService.playStation(station);
    await flush();
    gate[0]();
    gate[1]();
    await Promise.all([p1, p2]);

    expect(created).toHaveLength(2);
    expect(created[0].unloadAsync).toHaveBeenCalled();
    expect(RadioService.sound).toBe(created[1]);

    await RadioService.stop();
    expect(created[1].unloadAsync).toHaveBeenCalled();
    expect(RadioService.sound).toBeNull();
  });

  it('stop supersedes an in-flight play so its sound never leaks', async () => {
    let resolveCreate;
    Audio.Sound.createAsync.mockImplementationOnce(() => new Promise((resolve) => {
      resolveCreate = () => resolve({ sound: mockMakeSound() });
    }));

    const playing = RadioService.playStation(station);
    await flush();
    await RadioService.stop();
    resolveCreate();
    await playing;

    const leaked = mockState.lastSound;
    expect(leaked.unloadAsync).toHaveBeenCalled();
    expect(RadioService.sound).toBeNull();
    expect(RadioService.activeStation).toBeNull();
  });

  it('flags the station as failed when createAsync rejects and clears on the next successful play', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Audio.Sound.createAsync.mockImplementationOnce(() => Promise.reject(new Error('HTTP 500')));
    await RadioService.playStation(station);
    expect(RadioService.failedStationId).toBe(station.id);
    expect(RadioService.isPlaying).toBe(false);
    expect(RadioService.activeStation).toEqual(station);

    await RadioService.playStation(station);
    expect(RadioService.failedStationId).toBeNull();
    expect(RadioService.isPlaying).toBe(true);
    warn.mockRestore();
  });

  it('flags the station as failed on a mid-stream error', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await RadioService.playStation(station);
    mockState.lastSound.cb({ isLoaded: false, error: 'stream died' });
    expect(RadioService.failedStationId).toBe(station.id);
    expect(RadioService.isPlaying).toBe(false);
    warn.mockRestore();
  });

  it('stop clears the failed station flag', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Audio.Sound.createAsync.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    await RadioService.playStation(station);
    expect(RadioService.failedStationId).toBe(station.id);
    await RadioService.stop();
    expect(RadioService.failedStationId).toBeNull();
    warn.mockRestore();
  });

  it('stop unloads the sound and clears state', async () => {
    await RadioService.playStation(station);
    const sound = mockState.lastSound;
    await RadioService.stop();
    expect(sound.unloadAsync).toHaveBeenCalled();
    expect(RadioService.sound).toBeNull();
    expect(RadioService.activeStation).toBeNull();
    expect(RadioService.isPlaying).toBe(false);
  });
});
