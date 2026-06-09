jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    RecordingOptionsPresets: { LOW_QUALITY: {} },
    Recording: { createAsync: jest.fn() },
  },
}));

jest.mock('../../assets/quran/data/words.json', () => ({
  // 3 regular words
  '1:1': [{ ar: 'a' }, { ar: 'b' }, { ar: 'c' }],
  // 1 regular word + 1 end marker (filtered by wordCountForAyah)
  '1:2': [{ ar: 'x' }, { type: 'end', ar: '۝' }],
}));

jest.mock('../../utils/QuranAudio', () => ({
  flatVerses: [
    { surah: 1, ayah: 1, page: 1 },
    { surah: 1, ayah: 2, page: 1 },
  ],
  verseIndex: { '1:1': 0, '1:2': 1 },
}));

const { Audio } = require('expo-av');
const service = require('../../utils/QuranVoiceFollower').default;

function makeRecording({ metering = -50 } = {}) {
  return {
    getStatusAsync: jest.fn().mockResolvedValue({ isRecording: true, metering }),
    stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Audio.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Audio.Recording.createAsync.mockResolvedValue({ recording: makeRecording() });
});

afterEach(async () => {
  await service.stop();
});

describe('QuranVoiceFollower', () => {
  describe('subscribe', () => {
    it('immediately delivers current state on subscription', () => {
      const received = [];
      const unsub = service.subscribe((s) => received.push(s));
      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ active: false, activeAyah: null, playingWordIdx: null });
      unsub();
    });

    it('delivers updates after start', async () => {
      const received = [];
      const unsub = service.subscribe((s) => received.push({ ...s }));
      await service.start({ surah: 1, ayah: 1 });
      expect(received.length).toBeGreaterThanOrEqual(2);
      expect(received.at(-1)).toMatchObject({ active: true, activeAyah: { surah: 1, ayah: 1 } });
      unsub();
    });

    it('stops delivering after unsubscribe', async () => {
      const received = [];
      const unsub = service.subscribe((s) => received.push({ ...s }));
      const countBefore = received.length;
      unsub();
      await service.start({ surah: 1, ayah: 1 });
      expect(received.length).toBe(countBefore);
    });
  });

  describe('start', () => {
    it('activates the service and emits initial state', async () => {
      await service.start({ surah: 1, ayah: 1 });
      expect(service.active).toBe(true);
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 1 });
      expect(service.playingWordIdx).toBe(0);
    });

    it('requests microphone permission', async () => {
      await service.start({ surah: 1, ayah: 1 });
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('creates a recording with metering enabled', async () => {
      await service.start({ surah: 1, ayah: 1 });
      expect(Audio.Recording.createAsync).toHaveBeenCalledWith(
        expect.objectContaining({ isMeteringEnabled: true })
      );
    });

    it('stays inactive when permission is denied', async () => {
      Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      await service.start({ surah: 1, ayah: 1 });
      expect(service.active).toBe(false);
      expect(Audio.Recording.createAsync).not.toHaveBeenCalled();
    });

    it('stays inactive when recording creation fails', async () => {
      Audio.Recording.createAsync.mockRejectedValueOnce(new Error('mic busy'));
      await service.start({ surah: 1, ayah: 1 });
      expect(service.active).toBe(false);
    });

    it('stops the previous session before starting a new one', async () => {
      await service.start({ surah: 1, ayah: 1 });
      const firstRecording = service._recording;
      await service.start({ surah: 1, ayah: 2 });
      expect(firstRecording.stopAndUnloadAsync).toHaveBeenCalled();
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
    });

    it('starts poll and advance timers', async () => {
      await service.start({ surah: 1, ayah: 1 });
      expect(service._pollTimer).not.toBeNull();
      expect(service._advanceTimer).not.toBeNull();
    });
  });

  describe('stop', () => {
    it('deactivates the service and resets state', async () => {
      await service.start({ surah: 1, ayah: 1 });
      await service.stop();
      expect(service.active).toBe(false);
      expect(service.activeAyah).toBeNull();
      expect(service.playingWordIdx).toBeNull();
    });

    it('emits an inactive state to subscribers', async () => {
      await service.start({ surah: 1, ayah: 1 });
      const received = [];
      const unsub = service.subscribe((s) => received.push({ ...s }));
      await service.stop();
      expect(received.at(-1).active).toBe(false);
      unsub();
    });

    it('clears poll and advance timers', async () => {
      await service.start({ surah: 1, ayah: 1 });
      await service.stop();
      expect(service._pollTimer).toBeNull();
      expect(service._advanceTimer).toBeNull();
    });

    it('unloads the recording', async () => {
      await service.start({ surah: 1, ayah: 1 });
      const rec = service._recording;
      await service.stop();
      expect(rec.stopAndUnloadAsync).toHaveBeenCalled();
      expect(service._recording).toBeNull();
    });

    it('is safe to call when not started', async () => {
      await expect(service.stop()).resolves.not.toThrow();
    });
  });

  describe('_advance', () => {
    beforeEach(async () => {
      await service.start({ surah: 1, ayah: 1 });
    });

    it('increments word index within an ayah', () => {
      service._advance();
      expect(service.playingWordIdx).toBe(1);
      service._advance();
      expect(service.playingWordIdx).toBe(2);
    });

    it('advances to the next ayah when the last word is reached', () => {
      // 1:1 has 3 words; advance 3× from idx 0 to exhaust it
      service._advance();
      service._advance();
      service._advance();
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
      expect(service.playingWordIdx).toBe(0);
    });

    it('stays at the last word when at the final verse', () => {
      // 1:2 has 1 non-end word so wordCount = 1; no verse follows it
      service.activeAyah = { surah: 1, ayah: 2 };
      service.playingWordIdx = 0;
      service._advance();
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
      expect(service.playingWordIdx).toBe(0);
    });

    it('emits updated state after each advance', () => {
      const received = [];
      const unsub = service.subscribe((s) => received.push({ ...s }));
      const before = received.length;
      service._advance();
      expect(received.length).toBe(before + 1);
      expect(received.at(-1).playingWordIdx).toBe(1);
      unsub();
    });
  });
});
