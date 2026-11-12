// The global jest.setup.js mocks the entire ./utils/Sounds module — undo that for these tests.
jest.unmock('@/utils/audio/Sounds');

jest.mock('expo-audio', () => {
  const makePlayer = () => {
    const player = {
      currentStatus: { isLoaded: true, playing: false },
      play: jest.fn(() => { player.currentStatus.playing = true; }),
      pause: jest.fn(() => { player.currentStatus.playing = false; }),
      seekTo: jest.fn(async () => {}),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      remove: jest.fn(),
    };
    return player;
  };
  return {
    setAudioModeAsync: jest.fn(async () => {}),
    createAudioPlayer: jest.fn(makePlayer),
  };
});

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sounds from '@/utils/audio/Sounds';
import AdhanDownloader from '@/utils/prayer/AdhanDownloader';


describe('Sounds (singleton audio service)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Each test gets a fresh init; force re-initialization by calling cleanup first
    await Sounds.cleanup();
  });

  describe('initialize()', () => {
    it('configures audio mode for background + silent-mode playback', async () => {
      await Sounds.initialize();
      expect(setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'duckOthers',
        })
      );
    });

    it('loads both short alert and full adhan sounds', async () => {
      await Sounds.initialize();
      expect(createAudioPlayer).toHaveBeenCalledTimes(2);
    });

    it('is idempotent — second call is a no-op', async () => {
      await Sounds.initialize();
      createAudioPlayer.mockClear();
      await Sounds.initialize();
      expect(createAudioPlayer).not.toHaveBeenCalled();
    });

    it('rethrows when expo-audio setAudioModeAsync fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setAudioModeAsync.mockRejectedValueOnce(new Error('boom'));
      await expect(Sounds.initialize()).rejects.toThrow('boom');
      spy.mockRestore();
    });
  });

  describe('playShortAlert()', () => {
    it('auto-initializes if not already initialized', async () => {
      await Sounds.playShortAlert();
      expect(setAudioModeAsync).toHaveBeenCalled();
    });

    it('resets to start and plays', async () => {
      await Sounds.initialize();
      const shortSound = Sounds.shortAlertSound;
      await Sounds.playShortAlert();
      expect(shortSound.seekTo).toHaveBeenCalledWith(0);
      expect(shortSound.play).toHaveBeenCalled();
    });

    it('stops first if already playing', async () => {
      await Sounds.initialize();
      const shortSound = Sounds.shortAlertSound;
      shortSound.currentStatus = { isLoaded: true, playing: true };
      await Sounds.playShortAlert();
      expect(shortSound.pause).toHaveBeenCalled();
    });

    it('logs but does not throw on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.shortAlertSound.play.mockImplementationOnce(() => { throw new Error('boom'); });
      await expect(Sounds.playShortAlert()).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('playFullAdhan() and stopFullAdhan()', () => {
    it('sets isPlayingFullAdhan true while playing', async () => {
      await Sounds.initialize();
      await Sounds.playFullAdhan();
      expect(Sounds.isFullAdhanPlaying()).toBe(true);
    });

    it('flips isPlayingFullAdhan back to false on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.fullAdhanSound.play.mockImplementationOnce(() => { throw new Error('boom'); });
      await Sounds.playFullAdhan();
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
      spy.mockRestore();
    });

    it.each([
      ['paused', { isLoaded: true, playing: false }],
      ['playing', { isLoaded: true, playing: true }],
      ['buffering', { isLoaded: false, playing: true, isBuffering: true }],
      ['loading', { isLoaded: false, playing: false }],
    ])('stopFullAdhan pauses a %s player to cancel playback', async (_, status) => {
      await Sounds.initialize();
      const fullSound = Sounds.fullAdhanSound;
      fullSound.currentStatus = status;
      Sounds.isPlayingFullAdhan = true;
      await Sounds.stopFullAdhan();
      expect(fullSound.pause).toHaveBeenCalledTimes(1);
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
    });

    it('stopFullAdhan is a no-op when adhan sound not loaded', async () => {
      // Sounds is not initialized — fullAdhanSound is null
      await expect(Sounds.stopFullAdhan()).resolves.toBeUndefined();
    });

    it('stopFullAdhan logs and resets flag on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.fullAdhanSound.currentStatus.playing = true;
      Sounds.fullAdhanSound.pause.mockImplementationOnce(() => { throw new Error('boom'); });
      await Sounds.stopFullAdhan();
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('selected recitation source', () => {
    it('reloads the full adhan from the selected downloaded recitation', async () => {
      await Sounds.initialize();
      const previous = Sounds.fullAdhanSound;
      createAudioPlayer.mockClear();
      AsyncStorage.getItem.mockResolvedValueOnce('alafasy');
      const spy = jest
        .spyOn(AdhanDownloader, 'getPlayableUri')
        .mockResolvedValueOnce('/mock/document/adhans/alafasy.mp3');
      await Sounds.playFullAdhan();
      expect(createAudioPlayer).toHaveBeenCalledWith(
        { uri: '/mock/document/adhans/alafasy.mp3' }
      );
      expect(previous.pause.mock.invocationCallOrder[0]).toBeLessThan(previous.remove.mock.invocationCallOrder[0]);
      spy.mockRestore();
    });

    it('keeps the bundled adhan when the selection is not downloaded', async () => {
      await Sounds.initialize();
      createAudioPlayer.mockClear();
      AsyncStorage.getItem.mockResolvedValueOnce('alafasy');
      const spy = jest.spyOn(AdhanDownloader, 'getPlayableUri').mockResolvedValueOnce(null);
      await Sounds.playFullAdhan();
      expect(createAudioPlayer).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('_onFullAdhanPlaybackUpdate', () => {
    it('mirrors isPlaying status', () => {
      Sounds.isPlayingFullAdhan = true;
      Sounds._onFullAdhanPlaybackUpdate({ isLoaded: true, playing: false });
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
    });

    it('resets flag when didJustFinish', () => {
      Sounds.isPlayingFullAdhan = true;
      Sounds._onFullAdhanPlaybackUpdate({
        isLoaded: true,
        playing: false,
        didJustFinish: true,
      });
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
    });

    it('ignores updates when sound is not loaded', () => {
      Sounds.isPlayingFullAdhan = true;
      Sounds._onFullAdhanPlaybackUpdate({ isLoaded: false });
      expect(Sounds.isFullAdhanPlaying()).toBe(true); // unchanged
    });
  });

  describe('playNotificationSound (router)', () => {
    it('plays short alert when soundType=short and not tapped', async () => {
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockResolvedValue();
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('short', false);
      expect(shortSpy).toHaveBeenCalled();
      expect(fullSpy).not.toHaveBeenCalled();
      shortSpy.mockRestore();
      fullSpy.mockRestore();
    });

    it('plays full adhan when soundType=full and tapped', async () => {
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('full', true);
      expect(fullSpy).toHaveBeenCalled();
      fullSpy.mockRestore();
    });

    it('plays full adhan when soundType=short and tapped (user expressed intent)', async () => {
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('short', true);
      expect(fullSpy).toHaveBeenCalled();
      fullSpy.mockRestore();
    });

    it('plays the short alert (not the full adhan) for soundType=full when not tapped', async () => {
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockResolvedValue();
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('full', false);
      expect(shortSpy).toHaveBeenCalled();
      expect(fullSpy).not.toHaveBeenCalled();
      shortSpy.mockRestore();
      fullSpy.mockRestore();
    });

    it('does nothing for soundType=none', async () => {
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockResolvedValue();
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('none', false);
      await Sounds.playNotificationSound('none', true);
      expect(shortSpy).not.toHaveBeenCalled();
      expect(fullSpy).not.toHaveBeenCalled();
      shortSpy.mockRestore();
      fullSpy.mockRestore();
    });

    it('logs but does not throw on internal error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockRejectedValue(new Error('boom'));
      await expect(Sounds.playNotificationSound('short', false)).resolves.toBeUndefined();
      shortSpy.mockRestore();
      spy.mockRestore();
    });
  });

  describe('cleanup()', () => {
    it('unloads both sounds and resets initialized flag', async () => {
      await Sounds.initialize();
      const shortSound = Sounds.shortAlertSound;
      const fullSound = Sounds.fullAdhanSound;
      await Sounds.cleanup();
      expect(shortSound.remove).toHaveBeenCalled();
      expect(fullSound.remove).toHaveBeenCalled();
      expect(shortSound.pause.mock.invocationCallOrder[0]).toBeLessThan(shortSound.remove.mock.invocationCallOrder[0]);
      expect(fullSound.pause.mock.invocationCallOrder[0]).toBeLessThan(fullSound.remove.mock.invocationCallOrder[0]);
      expect(Sounds.shortAlertSound).toBeNull();
      expect(Sounds.fullAdhanSound).toBeNull();
    });

    it('is safe to call when not initialized', async () => {
      await expect(Sounds.cleanup()).resolves.toBeUndefined();
    });

    it('logs but does not throw on unload error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.shortAlertSound.remove.mockImplementationOnce(() => { throw new Error('boom'); });
      await expect(Sounds.cleanup()).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('playBeep (legacy)', () => {
    it('delegates to playShortAlert', async () => {
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockResolvedValue();
      await Sounds.playBeep();
      expect(shortSpy).toHaveBeenCalled();
      shortSpy.mockRestore();
    });

    it('logs but does not throw on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockRejectedValue(new Error('boom'));
      await expect(Sounds.playBeep()).resolves.toBeUndefined();
      shortSpy.mockRestore();
      spy.mockRestore();
    });
  });
});
