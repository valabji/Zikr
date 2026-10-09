import { AudioModule, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { runMicTest } from '@/utils/quran/MicTest';

jest.mock('expo-audio', () => ({
  AudioModule: { AudioRecorder: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: { sampleRate: 44100, ios: {}, android: {} } },
  createAudioPlayer: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(async () => {}),
}));

describe('microphone test', () => {
  let recorder;
  let player;
  let onStatus;
  let subscription;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    requestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
    recorder = {
      prepareToRecordAsync: jest.fn(async () => {}),
      record: jest.fn(),
      stop: jest.fn(async () => {}),
      release: jest.fn(),
      uri: 'file:///recording.m4a',
      isRecording: false,
    };
    subscription = { remove: jest.fn() };
    player = {
      addListener: jest.fn((event, callback) => { onStatus = callback; return subscription; }),
      play: jest.fn(),
      remove: jest.fn(),
    };
    AudioModule.AudioRecorder.mockImplementation(() => recorder);
    createAudioPlayer.mockReturnValue(player);
  });

  afterEach(() => jest.useRealTimers());

  it('records, restores playback mode, plays the recording, and releases resources', async () => {
    const notify = jest.fn();
    const result = runMicTest(notify);
    await jest.advanceTimersByTimeAsync(3000);
    expect(recorder.record).toHaveBeenCalled();
    expect(recorder.stop).toHaveBeenCalled();
    expect(setAudioModeAsync).toHaveBeenLastCalledWith({ allowsRecording: false, playsInSilentMode: true });
    expect(createAudioPlayer).toHaveBeenCalledWith({ uri: recorder.uri });
    expect(player.play).toHaveBeenCalled();
    onStatus({ didJustFinish: true });
    await result;
    expect(notify.mock.calls.flat()).toEqual(['recording', 'playing', 'idle']);
    expect(subscription.remove).toHaveBeenCalled();
    expect(player.remove).toHaveBeenCalled();
    expect(recorder.release).toHaveBeenCalled();
  });

  it('does not record after permission denial', async () => {
    requestRecordingPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const notify = jest.fn();
    await runMicTest(notify);
    expect(notify).toHaveBeenCalledWith('denied');
    expect(AudioModule.AudioRecorder).not.toHaveBeenCalled();
    expect(setAudioModeAsync).not.toHaveBeenCalled();
  });

  it('restores playback mode when recording fails', async () => {
    recorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('microphone busy'));
    const notify = jest.fn();
    await runMicTest(notify);
    expect(notify).toHaveBeenCalledWith('error');
    expect(setAudioModeAsync).toHaveBeenLastCalledWith({ allowsRecording: false, playsInSilentMode: true });
    expect(recorder.release).toHaveBeenCalled();
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('releases playback resources on an audio error and allows another test', async () => {
    const notify = jest.fn();
    const result = runMicTest(notify);
    await jest.advanceTimersByTimeAsync(3000);
    await runMicTest(jest.fn());
    expect(AudioModule.AudioRecorder).toHaveBeenCalledTimes(1);
    onStatus({ error: 'decode failed' });
    await result;
    expect(notify).toHaveBeenLastCalledWith('error');
    expect(player.remove).toHaveBeenCalled();
    requestRecordingPermissionsAsync.mockResolvedValueOnce({ granted: false });
    await runMicTest(notify);
    expect(notify).toHaveBeenLastCalledWith('denied');
  });
});
