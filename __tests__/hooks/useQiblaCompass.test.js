jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchHeadingAsync: jest.fn(),
}));

jest.mock('expo-sensors', () => ({
  Magnetometer: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
    removeAllListeners: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    isAvailableAsync: jest.fn(),
  },
}));

jest.mock('../../locales/i18n', () => ({
  t: jest.fn((key) => key),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useQiblaCompass } from '../../hooks/useQiblaCompass';

describe('useQiblaCompass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Platform.OS = 'ios';
  });

  it('exposes the expected API and initial state', () => {
    const { result } = renderHook(() => useQiblaCompass());
    expect(result.current.compassEnabled).toBe(false);
    expect(result.current.currentHeading).toBe(0);
    expect(result.current.compassMethod).toBe('');
    expect(result.current.compassAccuracy).toBeNull();
    expect(result.current.availableMethods).toEqual([]);
    expect(typeof result.current.initializeCompass).toBe('function');
    expect(typeof result.current.cleanupCompass).toBe('function');
    expect(typeof result.current.swapCompassMethod).toBe('function');
    expect(typeof result.current.checkAvailableMethods).toBe('function');
  });

  describe('checkAvailableMethods', () => {
    it('returns [] on web', async () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useQiblaCompass());
      const methods = await result.current.checkAvailableMethods();
      expect(methods).toEqual([]);
    });

    it('includes trueHeading + magHeading when Location services are enabled', async () => {
      Location.hasServicesEnabledAsync.mockResolvedValue(true);
      Magnetometer.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useQiblaCompass());
      const methods = await result.current.checkAvailableMethods();
      expect(methods).toContain('trueHeading');
      expect(methods).toContain('magHeading');
    });

    it('includes magnetometer when sensor is available', async () => {
      Location.hasServicesEnabledAsync.mockResolvedValue(false);
      Magnetometer.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(true);
      const { result } = renderHook(() => useQiblaCompass());
      const methods = await result.current.checkAvailableMethods();
      expect(methods).toContain('magnetometer');
    });

    it('returns [] when all detection attempts fail', async () => {
      Location.hasServicesEnabledAsync.mockRejectedValue(new Error('no location'));
      Magnetometer.isAvailableAsync.mockRejectedValue(new Error('no sensor'));
      const { result } = renderHook(() => useQiblaCompass());
      const methods = await result.current.checkAvailableMethods();
      expect(methods).toEqual([]);
    });
  });

  describe('initializeCompass', () => {
    it('returns false when no methods are available', async () => {
      Location.hasServicesEnabledAsync.mockResolvedValue(false);
      Magnetometer.isAvailableAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.initializeCompass();
      });
      expect(outcome).toBe(false);
    });

    it('falls back to magnetometer when location heading is unavailable', async () => {
      Location.hasServicesEnabledAsync.mockResolvedValue(false);
      Magnetometer.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(true);

      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.initializeCompass();
      });
      expect(outcome).toBe(true);
      expect(Magnetometer.addListener).toHaveBeenCalled();
    });

    it('returns false on web (no compass methods at all)', async () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.initializeCompass();
      });
      expect(outcome).toBe(false);
    });
  });

  describe('cleanupCompass', () => {
    it('removes active subscriptions', async () => {
      // Wire up a magnetometer subscription via initializeCompass
      Location.hasServicesEnabledAsync.mockResolvedValue(false);
      Magnetometer.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(true);

      const subscription = { remove: jest.fn() };
      Magnetometer.addListener.mockReturnValueOnce(subscription);

      const { result } = renderHook(() => useQiblaCompass());
      await act(async () => {
        await result.current.initializeCompass();
      });
      act(() => {
        result.current.cleanupCompass();
      });
      expect(subscription.remove).toHaveBeenCalled();
    });

    it('is safe to call when no subscriptions exist', () => {
      const { result } = renderHook(() => useQiblaCompass());
      expect(() => result.current.cleanupCompass()).not.toThrow();
    });
  });

  describe('setupMagnetometer (via swapCompassMethod)', () => {
    it('aborts on web', async () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.swapCompassMethod('magnetometer');
      });
      expect(outcome).toBe(false);
    });

    it('returns false when permission is denied', async () => {
      Magnetometer.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.swapCompassMethod('magnetometer');
      });
      expect(outcome).toBe(false);
    });

    it('returns false when magnetometer is unavailable', async () => {
      Magnetometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.swapCompassMethod('magnetometer');
      });
      expect(outcome).toBe(false);
    });

    it('subscribes to magnetometer and updates currentHeading from data', async () => {
      Magnetometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Magnetometer.isAvailableAsync.mockResolvedValue(true);
      const listeners = [];
      Magnetometer.addListener.mockImplementation((cb) => {
        listeners.push(cb);
        return { remove: jest.fn() };
      });
      const { result } = renderHook(() => useQiblaCompass());
      await act(async () => {
        await result.current.swapCompassMethod('magnetometer');
      });
      // Trigger a sensor reading
      act(() => {
        listeners[0]({ x: 1, y: 0, z: 0 });
      });
      // currentHeading should be computed from x,y,z
      expect(typeof result.current.currentHeading).toBe('number');
    });
  });

  describe('swapCompassMethod (location modes)', () => {
    it('clears the "dismiss permission" preference when switching to trueHeading', async () => {
      Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.hasServicesEnabledAsync.mockResolvedValue(true);
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 40, longitude: -74 },
      });
      Location.watchHeadingAsync.mockResolvedValue({ remove: jest.fn() });

      const { result } = renderHook(() => useQiblaCompass());
      await act(async () => {
        await result.current.swapCompassMethod('trueHeading');
      });
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('qibla_location_permission_dismissed');
    });

    it('falls through to initializeCompass when switching to "auto"', async () => {
      // No methods available → initializeCompass returns false
      Location.hasServicesEnabledAsync.mockResolvedValue(false);
      Magnetometer.isAvailableAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useQiblaCompass());
      let outcome;
      await act(async () => {
        outcome = await result.current.swapCompassMethod('auto');
      });
      expect(outcome).toBe(false);
    });
  });
});
