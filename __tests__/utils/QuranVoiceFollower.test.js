jest.mock('../../assets/quran/data/words.json', () => ({
  '1:1': [{ ar: 'بِسْمِ' }, { ar: 'ٱللَّهِ' }, { ar: 'ٱلرَّحْمَـٰنِ' }, { ar: 'ٱلرَّحِيمِ' }],
  '1:2': [
    { ar: 'ٱلْحَمْدُ' }, { ar: 'لِلَّهِ' }, { ar: 'رَبِّ' }, { ar: 'ٱلْعَـٰلَمِينَ' },
    { type: 'end', ar: '۝' },
  ],
  '2:1': [{ ar: 'الٓمٓ' }, { type: 'end', ar: '۝' }],
  '2:2': [{ ar: 'ذَٰلِكَ' }, { ar: 'ٱلْكِتَـٰبُ' }, { ar: 'لَا' }, { ar: 'رَيْبَ' }, { type: 'end', ar: '۝' }],
  '2:3': [{ ar: 'ٱلَّذِينَ' }, { ar: 'يُؤْمِنُونَ' }, { ar: 'بِٱلْغَيْبِ' }, { type: 'end', ar: '۝' }],
}));

jest.mock('../../utils/QuranAudio', () => ({
  flatVerses: [
    { surah: 1, ayah: 1, page: 1 },
    { surah: 1, ayah: 2, page: 1 },
    { surah: 2, ayah: 1, page: 2 },
    { surah: 2, ayah: 2, page: 2 },
    { surah: 2, ayah: 3, page: 2 },
  ],
}));

const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
const service = require('../../utils/QuranVoiceFollower').default;

const emitResult = (transcript, isFinal = false) =>
  ExpoSpeechRecognitionModule.__emit('result', { isFinal, results: [{ transcript }] });

beforeEach(() => {
  ExpoSpeechRecognitionModule.__reset();
  jest.clearAllMocks();
  ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValue({ granted: true });
  ExpoSpeechRecognitionModule.supportsOnDeviceRecognition.mockReturnValue(true);
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
      expect(received[0]).toEqual({ active: false, paused: false, activeAyah: null, playingWordIdx: null, mistake: false, pendingPrompt: null });
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
    it('activates at the requested ayah and starts recognition', async () => {
      await service.start({ surah: 1, ayah: 1 });
      expect(service.active).toBe(true);
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 1 });
      expect(service.playingWordIdx).toBe(0);
      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith(
        expect.objectContaining({ lang: 'ar-SA', continuous: true, interimResults: true })
      );
    });

    it('stays inactive when permission is denied', async () => {
      ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });
      await service.start({ surah: 1, ayah: 1 });
      expect(service.active).toBe(false);
      expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
    });

    it('stops a previous session before starting a new one', async () => {
      await service.start({ surah: 1, ayah: 1 });
      await service.start({ surah: 1, ayah: 2 });
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
    });
  });

  describe('recognition matching', () => {
    beforeEach(async () => {
      await service.start({ surah: 1, ayah: 1 });
    });

    it('advances the highlight to the recognized word', () => {
      emitResult('بسم الله');
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 1 });
      expect(service.playingWordIdx).toBe(1);
    });

    it('crosses into the next ayah when its words are recited', () => {
      emitResult('الحمد لله رب');
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
      expect(service.playingWordIdx).toBe(2);
    });

    it('tolerates orthography differences (full vs dagger alef)', () => {
      emitResult('الحمد لله رب العالمين');
      expect(service.activeAyah).toEqual({ surah: 1, ayah: 2 });
      expect(service.playingWordIdx).toBe(3);
    });

    it('does not move backward or on unrecognized speech', () => {
      emitResult('الحمد لله');
      const before = service.playingWordIdx;
      emitResult('قالشيءغريب');
      expect(service.playingWordIdx).toBe(before);
    });
  });

  describe('mismatch prompt', () => {
    beforeEach(async () => {
      await service.start({ surah: 1, ayah: 1 });
    });

    it('prompts on a confidently detected skip ahead without stopping the mic', () => {
      emitResult('الذين يؤمنون', true);
      expect(service.pendingPrompt).toEqual({ surah: 1, ayah: 1, toSurah: 2, toAyah: 3 });
      expect(ExpoSpeechRecognitionModule.stop).not.toHaveBeenCalled();
    });

    it('does not prompt on interim (non-final) results', () => {
      emitResult('الذين يؤمنون', false);
      expect(service.pendingPrompt).toBeNull();
    });

    it('does not prompt when the recitation matches nothing ahead', () => {
      emitResult('كلامغريب', true);
      expect(service.pendingPrompt).toBeNull();
    });

    it('resolving with "mistake" enters mistake mode', () => {
      emitResult('الذين يؤمنون', true);
      service.resolvePrompt('mistake');
      expect(service.mistake).toBe(true);
      expect(service.pendingPrompt).toBeNull();
    });

    it('resolving with "lookahead" jumps to the skipped position', () => {
      emitResult('الذين يؤمنون', true);
      service.resolvePrompt('lookahead');
      expect(service.pendingPrompt).toBeNull();
      expect(service.mistake).toBe(false);
      expect(service.activeAyah).toEqual({ surah: 2, ayah: 3 });
      expect(service.playingWordIdx).toBe(1);
    });

    it('clears mistake mode and advances once the correct word is recited', () => {
      emitResult('الذين يؤمنون', true);
      service.resolvePrompt('mistake');
      expect(service.mistake).toBe(true);
      emitResult('بسم الله');
      expect(service.mistake).toBe(false);
      expect(service.playingWordIdx).toBe(1);
    });

    it('does not re-prompt while already in mistake mode', () => {
      emitResult('الذين يؤمنون', true);
      service.resolvePrompt('mistake');
      emitResult('الذين يؤمنون', true);
      expect(service.pendingPrompt).toBeNull();
      expect(service.mistake).toBe(true);
    });
  });

  describe('pause / resume', () => {
    beforeEach(async () => {
      await service.start({ surah: 1, ayah: 1 });
    });

    it('pauses, stops recognition, and ignores results while paused', () => {
      service.pause();
      expect(service.paused).toBe(true);
      expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalled();
      emitResult('بسم الله');
      expect(service.playingWordIdx).toBe(0);
    });

    it('resumes and restarts recognition', () => {
      service.pause();
      ExpoSpeechRecognitionModule.start.mockClear();
      service.resume();
      expect(service.paused).toBe(false);
      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
    });

    it('ignores pause when inactive', async () => {
      await service.stop();
      service.pause();
      expect(service.paused).toBe(false);
    });
  });

  describe('stop', () => {
    it('deactivates, resets state, and aborts recognition', async () => {
      await service.start({ surah: 1, ayah: 1 });
      await service.stop();
      expect(service.active).toBe(false);
      expect(service.activeAyah).toBeNull();
      expect(service.playingWordIdx).toBeNull();
      expect(ExpoSpeechRecognitionModule.abort).toHaveBeenCalled();
    });

    it('is safe to call when not started', async () => {
      await expect(service.stop()).resolves.not.toThrow();
    });
  });

  describe('recognizer lifecycle', () => {
    it('relaunches recognition when a segment ends while active', async () => {
      await service.start({ surah: 1, ayah: 1 });
      ExpoSpeechRecognitionModule.start.mockClear();
      ExpoSpeechRecognitionModule.__emit('end');
      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
    });

    it('relaunches after a stall when no end event fires (network mode)', async () => {
      jest.useFakeTimers();
      try {
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition.mockReturnValue(false);
        await service.start({ surah: 1, ayah: 1 });
        ExpoSpeechRecognitionModule.start.mockClear();
        jest.advanceTimersByTime(7000);
        expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not abort a session that keeps emitting lifecycle events', async () => {
      jest.useFakeTimers();
      try {
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition.mockReturnValue(false);
        await service.start({ surah: 1, ayah: 1 });
        ExpoSpeechRecognitionModule.start.mockClear();
        jest.advanceTimersByTime(5000);
        ExpoSpeechRecognitionModule.__emit('speechstart');
        jest.advanceTimersByTime(5000);
        expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('falls back from on-device to network on language-not-supported', async () => {
      await service.start({ surah: 1, ayah: 1 });
      ExpoSpeechRecognitionModule.__emit('error', { error: 'language-not-supported' });
      expect(service.active).toBe(true);
      expect(service._onDevice).toBe(false);
    });

    it('stops following on a fatal error', async () => {
      await service.start({ surah: 1, ayah: 1 });
      ExpoSpeechRecognitionModule.__emit('error', { error: 'audio-capture' });
      expect(service.active).toBe(false);
    });
  });
});
