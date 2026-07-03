// Reset modules so the singleton's auto-initialize() in module scope runs fresh per test.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

const VIBRATION_TYPES = {
  OFF: 'off',
  ON_NEXT: 'on_next',
  ON_EVERY: 'on_every',
};
const VIBRATION_INTENSITY = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
};

// Helper to load a fresh module
const loadVibration = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('../Vibration');
  });
  // Allow the auto-initialize() promise to settle
  await new Promise((r) => setImmediate(r));
  return mod;
};

describe('VibrationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Platform.OS = 'ios';
  });

  it('exports VIBRATION_TYPES and VIBRATION_INTENSITY constants', async () => {
    const mod = await loadVibration();
    expect(mod.VIBRATION_TYPES).toEqual(VIBRATION_TYPES);
    expect(mod.VIBRATION_INTENSITY).toEqual(VIBRATION_INTENSITY);
  });

  it('auto-initializes from AsyncStorage on import', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@vibrationTasbih') return Promise.resolve('true');
      if (key === '@vibrationAzkar') return Promise.resolve(VIBRATION_TYPES.ON_EVERY);
      if (key === '@vibrationIntensity') return Promise.resolve(VIBRATION_INTENSITY.HEAVY);
      return Promise.resolve(null);
    });
    const { default: manager } = await loadVibration();
    expect(manager.getTasbihSetting()).toBe(true);
    expect(manager.getAzkarSetting()).toBe(VIBRATION_TYPES.ON_EVERY);
    expect(manager.getIntensity()).toBe(VIBRATION_INTENSITY.HEAVY);
  });

  it('falls back to defaults if storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const { default: manager } = await loadVibration();
    expect(manager.getTasbihSetting()).toBe(false);
    expect(manager.getAzkarSetting()).toBe(VIBRATION_TYPES.OFF);
    expect(manager.getIntensity()).toBe(VIBRATION_INTENSITY.LIGHT);
  });

  it('handles storage failure during init', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
    const { default: manager } = await loadVibration();
    // Should keep defaults
    expect(manager.getTasbihSetting()).toBe(false);
    warn.mockRestore();
  });

  it('saves tasbih setting to storage and updates in-memory state', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const { default: manager } = await loadVibration();
    await manager.setTasbihVibration(true);
    expect(manager.getTasbihSetting()).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@vibrationTasbih', 'true');
  });

  it('saves azkar and intensity settings', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const { default: manager } = await loadVibration();
    await manager.setAzkarVibration(VIBRATION_TYPES.ON_NEXT);
    await manager.setVibrationIntensity(VIBRATION_INTENSITY.MEDIUM);
    expect(manager.getAzkarSetting()).toBe(VIBRATION_TYPES.ON_NEXT);
    expect(manager.getIntensity()).toBe(VIBRATION_INTENSITY.MEDIUM);
  });

  it('warns but does not throw on storage save failure', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    AsyncStorage.getItem.mockResolvedValue(null);
    const { default: manager } = await loadVibration();
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('boom'));
    await expect(manager.setTasbihVibration(true)).resolves.toBeUndefined();
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('boom'));
    await expect(manager.setAzkarVibration(VIBRATION_TYPES.ON_EVERY)).resolves.toBeUndefined();
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('boom'));
    await expect(manager.setVibrationIntensity(VIBRATION_INTENSITY.LIGHT)).resolves.toBeUndefined();
    warn.mockRestore();
  });

  describe('vibrateForTasbih', () => {
    it('triggers Light haptic when enabled with light intensity', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationTasbih') return Promise.resolve('true');
        if (k === '@vibrationIntensity') return Promise.resolve(VIBRATION_INTENSITY.LIGHT);
        return Promise.resolve(null);
      });
      const { default: manager } = await loadVibration();
      manager.vibrateForTasbih();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('uses Medium / Heavy when set', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationTasbih') return Promise.resolve('true');
        if (k === '@vibrationIntensity') return Promise.resolve(VIBRATION_INTENSITY.MEDIUM);
        return Promise.resolve(null);
      });
      const { default: m1 } = await loadVibration();
      m1.vibrateForTasbih();
      expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Medium);

      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationTasbih') return Promise.resolve('true');
        if (k === '@vibrationIntensity') return Promise.resolve(VIBRATION_INTENSITY.HEAVY);
        return Promise.resolve(null);
      });
      const { default: m2 } = await loadVibration();
      m2.vibrateForTasbih();
      expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('does nothing when tasbih vibration is disabled', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const { default: manager } = await loadVibration();
      manager.vibrateForTasbih();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('is a no-op on web', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationTasbih') return Promise.resolve('true');
        return Promise.resolve(null);
      });
      const { default: manager } = await loadVibration();
      global.Platform.OS = 'web';
      manager.vibrateForTasbih();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('vibrateForAzkarCount and vibrateForNextZikr', () => {
    it('count fires only when ON_EVERY', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationAzkar') return Promise.resolve(VIBRATION_TYPES.ON_EVERY);
        return Promise.resolve(null);
      });
      const { default: m } = await loadVibration();
      m.vibrateForAzkarCount();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });

    it('next fires when ON_NEXT or ON_EVERY, but not OFF', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationAzkar') return Promise.resolve(VIBRATION_TYPES.ON_NEXT);
        return Promise.resolve(null);
      });
      const { default: m1 } = await loadVibration();
      m1.vibrateForNextZikr();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);

      AsyncStorage.getItem.mockResolvedValue(null);
      const { default: m2 } = await loadVibration();
      Haptics.impactAsync.mockClear();
      m2.vibrateForNextZikr();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('isVibrationSupported', () => {
    it('returns false on web', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const { default: m } = await loadVibration();
      global.Platform.OS = 'web';
      await expect(m.isVibrationSupported()).resolves.toBe(false);
    });

    it('returns true on native without firing a haptic', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const { default: m } = await loadVibration();
      await expect(m.isVibrationSupported()).resolves.toBe(true);
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });
  });

  describe('android path', () => {
    beforeEach(() => {
      global.Platform.OS = 'android';
    });

    it('vibrates by duration per intensity and does not use haptics', async () => {
      const cases = [
        [VIBRATION_INTENSITY.LIGHT, 20],
        [VIBRATION_INTENSITY.MEDIUM, 40],
        [VIBRATION_INTENSITY.HEAVY, 60],
      ];
      for (const [intensity, duration] of cases) {
        AsyncStorage.getItem.mockImplementation((k) => {
          if (k === '@vibrationTasbih') return Promise.resolve('true');
          if (k === '@vibrationIntensity') return Promise.resolve(intensity);
          return Promise.resolve(null);
        });
        const { default: m } = await loadVibration();
        Vibration.vibrate.mockClear();
        m.vibrateForTasbih();
        expect(Vibration.vibrate).toHaveBeenCalledWith(duration);
      }
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('uses a double-buzz pattern on tasbih complete', async () => {
      AsyncStorage.getItem.mockImplementation((k) => {
        if (k === '@vibrationTasbih') return Promise.resolve('true');
        return Promise.resolve(null);
      });
      const { default: m } = await loadVibration();
      m.vibrateForTasbihComplete();
      expect(Vibration.vibrate).toHaveBeenCalledWith([0, 30, 40, 30]);
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  it('uses Haptics success notification on tasbih complete (iOS)', async () => {
    AsyncStorage.getItem.mockImplementation((k) => {
      if (k === '@vibrationTasbih') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    const { default: m } = await loadVibration();
    m.vibrateForTasbihComplete();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });

  it('warns if vibrate methods are called before init', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Manually instantiate a fresh class without initializing
    let M;
    jest.isolateModules(() => {
      M = require('../Vibration');
    });
    // The exported manager is already initialized — to test the guard, we mutate
    M.default.isInitialized = false;
    M.default.vibrateForTasbih();
    M.default.vibrateForAzkarCount();
    M.default.vibrateForNextZikr();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
