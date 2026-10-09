import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadioService from '@/utils/radio/RadioService';
import QuranAudio from '@/utils/quran/QuranAudio';
import Sounds from '@/utils/audio/Sounds';
import { RADIO_CONSTANTS } from '@/constants/RadioConstants';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

const mockState = { lastSound: null };
const mockMakeSound = () => {
  const sound = {
    cb: null,
    currentStatus: { isLoaded: true, playing: true },
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    subscription: { remove: jest.fn() },
    addListener: jest.fn((event, cb) => { sound.cb = cb; return sound.subscription; }),
  };
  mockState.lastSound = sound;
  return sound;
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockMakeSound()),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/quran/QuranAudio', () => ({
  __esModule: true,
  default: { stop: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/utils/audio/Sounds', () => ({
  __esModule: true,
  default: { stopFullAdhan: jest.fn(() => Promise.resolve()) },
}));

const station = { id: 3, name: 'Test Radio', streamUrl: 'https://stream.example/3' };

describe('RadioService', () => {
  let store;
  beforeEach(() => {
    jest.clearAllMocks();
    createAudioPlayer.mockImplementation(() => mockMakeSound());
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
    expect(setAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
    }));
    expect(QuranAudio.stop).toHaveBeenCalled();
    expect(Sounds.stopFullAdhan).toHaveBeenCalled();
    expect(createAudioPlayer).toHaveBeenCalledWith(
      { uri: station.streamUrl },
    );
    expect(RadioService.activeStation).toEqual(station);
    expect(RadioService.isPlaying).toBe(true);
    expect(JSON.parse(store[STORAGE_KEYS.LAST_PLAYED])).toEqual(station);
  });

  it('ignores a station with no stream url', async () => {
    await RadioService.playStation({ id: 1, name: 'No URL' });
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(RadioService.activeStation).toBeNull();
  });

  it('switching stations unloads the previous sound', async () => {
    await RadioService.playStation(station);
    const first = mockState.lastSound;
    await RadioService.playStation({ id: 4, name: 'Second', streamUrl: 'https://stream.example/4' });
    expect(first.subscription.remove).toHaveBeenCalled();
    expect(first.remove).toHaveBeenCalled();
    expect(RadioService.activeStation.id).toBe(4);
  });

  it('playback status updates flow to subscribers', async () => {
    await RadioService.playStation(station);
    const fn = jest.fn();
    RadioService.subscribe(fn);
    fn.mockClear();
    mockState.lastSound.cb({ isLoaded: true, playing: false, isBuffering: true });
    expect(RadioService.isBuffering).toBe(true);
    expect(RadioService.isPlaying).toBe(false);
    expect(fn).toHaveBeenCalledWith({ activeStation: station, isPlaying: false, isBuffering: true, failedStationId: null });
  });

  it('toggle pauses when playing and resumes when paused', async () => {
    await RadioService.playStation(station);
    const sound = mockState.lastSound;
    sound.currentStatus = { isLoaded: true, playing: true };
    await RadioService.toggle();
    expect(sound.pause).toHaveBeenCalled();
    expect(RadioService.isPlaying).toBe(false);

    sound.currentStatus = { isLoaded: true, playing: false };
    await RadioService.toggle();
    expect(sound.play).toHaveBeenCalled();
    expect(RadioService.isPlaying).toBe(true);
  });

  it('a second play while setting audio mode supersedes the first', async () => {
    let release;
    setAudioModeAsync.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const first = RadioService.playStation(station);
    await RadioService.playStation({ ...station, id: 4 });
    release();
    await first;
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(RadioService.activeStation.id).toBe(4);
    expect(RadioService.sound).toBe(mockState.lastSound);
    expect(mockState.lastSound.remove).not.toHaveBeenCalled();
  });

  it('stop supersedes a play waiting for audio mode', async () => {
    let release;
    setAudioModeAsync.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const playing = RadioService.playStation(station);
    await RadioService.stop();
    release();
    await playing;
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(RadioService.sound).toBeNull();
    expect(RadioService.activeStation).toBeNull();
  });

  it('ignores status events from a replaced player', async () => {
    await RadioService.playStation(station);
    const stale = mockState.lastSound;
    await RadioService.playStation({ ...station, id: 4 });
    stale.cb({ isLoaded: false, error: 'late error' });
    expect(RadioService.failedStationId).toBeNull();
    expect(RadioService.isPlaying).toBe(true);
  });

  it('flags the station as failed when player creation throws and clears on the next successful play', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    createAudioPlayer.mockImplementationOnce(() => { throw new Error('HTTP 500'); });
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
    createAudioPlayer.mockImplementationOnce(() => { throw new Error('boom'); });
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
    expect(sound.remove).toHaveBeenCalled();
    expect(RadioService.sound).toBeNull();
    expect(RadioService.activeStation).toBeNull();
    expect(RadioService.isPlaying).toBe(false);
  });
});
