// The global jest.setup.js mocks the entire ./utils/Sounds module — undo that for these tests.
jest.unmock('../Sounds');

// Provide a richer expo-av mock than the global one (which is missing several APIs).
jest.mock('expo-av', () => {
  const makeSound = () => {
    let isPlaying = false;
    return {
      playAsync: jest.fn(async () => {
        isPlaying = true;
      }),
      stopAsync: jest.fn(async () => {
        isPlaying = false;
      }),
      setPositionAsync: jest.fn(async () => {}),
      setVolumeAsync: jest.fn(async () => {}),
      setOnPlaybackStatusUpdate: jest.fn(),
      unloadAsync: jest.fn(async () => {}),
      getStatusAsync: jest.fn(async () => ({ isLoaded: true, isPlaying })),
    };
  };
  return {
    Audio: {
      setAudioModeAsync: jest.fn(async () => {}),
      Sound: {
        createAsync: jest.fn(async () => ({ sound: makeSound() })),
      },
    },
  };
});

import { Audio } from 'expo-av';
import Sounds from '../Sounds';

const flush = () => new Promise((r) => setImmediate(r));

describe('Sounds (singleton audio service)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Each test gets a fresh init; force re-initialization by calling cleanup first
    await Sounds.cleanup();
  });

  describe('initialize()', () => {
    it('configures audio mode for background + silent-mode playback', async () => {
      await Sounds.initialize();
      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        })
      );
    });

    it('loads both short alert and full adhan sounds', async () => {
      await Sounds.initialize();
      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
    });

    it('is idempotent — second call is a no-op', async () => {
      await Sounds.initialize();
      Audio.Sound.createAsync.mockClear();
      await Sounds.initialize();
      expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    });

    it('rethrows when expo-av setAudioModeAsync fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Audio.setAudioModeAsync.mockRejectedValueOnce(new Error('boom'));
      await expect(Sounds.initialize()).rejects.toThrow('boom');
      spy.mockRestore();
    });
  });

  describe('playShortAlert()', () => {
    it('auto-initializes if not already initialized', async () => {
      await Sounds.playShortAlert();
      expect(Audio.setAudioModeAsync).toHaveBeenCalled();
    });

    it('resets to start and plays', async () => {
      await Sounds.initialize();
      const shortSound = Sounds.shortAlertSound;
      await Sounds.playShortAlert();
      expect(shortSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(shortSound.playAsync).toHaveBeenCalled();
    });

    it('stops first if already playing', async () => {
      await Sounds.initialize();
      const shortSound = Sounds.shortAlertSound;
      shortSound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: true });
      await Sounds.playShortAlert();
      expect(shortSound.stopAsync).toHaveBeenCalled();
    });

    it('logs but does not throw on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.shortAlertSound.playAsync.mockRejectedValueOnce(new Error('boom'));
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
      Sounds.fullAdhanSound.playAsync.mockRejectedValueOnce(new Error('boom'));
      await Sounds.playFullAdhan();
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
      spy.mockRestore();
    });

    it('stopFullAdhan only stops if currently playing', async () => {
      await Sounds.initialize();
      const fullSound = Sounds.fullAdhanSound;
      // Not playing
      fullSound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: false });
      await Sounds.stopFullAdhan();
      expect(fullSound.stopAsync).not.toHaveBeenCalled();

      // Playing
      fullSound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: true });
      await Sounds.stopFullAdhan();
      expect(fullSound.stopAsync).toHaveBeenCalled();
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
    });

    it('stopFullAdhan is a no-op when adhan sound not loaded', async () => {
      // Sounds is not initialized — fullAdhanSound is null
      await expect(Sounds.stopFullAdhan()).resolves.toBeUndefined();
    });

    it('stopFullAdhan logs and resets flag on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.fullAdhanSound.getStatusAsync.mockRejectedValueOnce(new Error('boom'));
      await Sounds.stopFullAdhan();
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('_onFullAdhanPlaybackUpdate', () => {
    it('mirrors isPlaying status', () => {
      Sounds.isPlayingFullAdhan = true;
      Sounds._onFullAdhanPlaybackUpdate({ isLoaded: true, isPlaying: false });
      expect(Sounds.isFullAdhanPlaying()).toBe(false);
    });

    it('resets flag when didJustFinish', () => {
      Sounds.isPlayingFullAdhan = true;
      Sounds._onFullAdhanPlaybackUpdate({
        isLoaded: true,
        isPlaying: false,
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

    it('does nothing for soundType=full when not tapped (don\'t auto-play full adhan)', async () => {
      const shortSpy = jest.spyOn(Sounds, 'playShortAlert').mockResolvedValue();
      const fullSpy = jest.spyOn(Sounds, 'playFullAdhan').mockResolvedValue();
      await Sounds.playNotificationSound('full', false);
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
      expect(shortSound.unloadAsync).toHaveBeenCalled();
      expect(fullSound.unloadAsync).toHaveBeenCalled();
      expect(Sounds.shortAlertSound).toBeNull();
      expect(Sounds.fullAdhanSound).toBeNull();
    });

    it('is safe to call when not initialized', async () => {
      await expect(Sounds.cleanup()).resolves.toBeUndefined();
    });

    it('logs but does not throw on unload error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await Sounds.initialize();
      Sounds.shortAlertSound.unloadAsync.mockRejectedValueOnce(new Error('boom'));
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
