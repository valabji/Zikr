import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/constants/ThemeProvider';
import { useTheme, useColors, useIsBrightTheme } from '@/constants/Colors';

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with isThemeLoaded=false and defaults to goldOnDark', async () => {
    AsyncStorage.getItem.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('goldOnDark');
    expect(result.current.isThemeLoaded).toBe(false);
  });

  it('flips isThemeLoaded=true when AsyncStorage resolves', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isThemeLoaded).toBe(true));
    expect(result.current.theme).toBe('goldOnDark'); // unchanged when nothing stored
  });

  it('uses the saved theme from storage', async () => {
    AsyncStorage.getItem.mockResolvedValue('paige');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe('paige'));
  });

  it('setTheme persists and updates the context', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isThemeLoaded).toBe(true));
    await act(async () => {
      await result.current.setTheme('chocolate');
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@theme', 'chocolate');
    expect(result.current.theme).toBe('chocolate');
  });

  it('flips isThemeLoaded=true even when storage errors', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isThemeLoaded).toBe(true));
    spy.mockRestore();
  });

  it('setTheme logs but does not throw on storage error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isThemeLoaded).toBe(true));
    await act(async () => {
      await result.current.setTheme('lavender');
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('useColors', () => {
    it('returns the active theme palette plus legacy aliases', async () => {
      AsyncStorage.getItem.mockResolvedValue('goldOnDark');
      const { result } = renderHook(() => useColors(), { wrapper });
      await waitFor(() => expect(result.current.accent).toBeDefined());
      // Legacy alias maps
      expect(result.current.BYellow).toBe(result.current.accent);
      expect(result.current.DGreen).toBe(result.current.primaryDark);
    });

    it('returns a fallback when no provider is present (useTheme fallback)', () => {
      const { result } = renderHook(() => useColors()); // no wrapper
      expect(result.current.accent).toBeDefined();
    });
  });

  describe('useIsBrightTheme', () => {
    it('returns false for dark themes', async () => {
      AsyncStorage.getItem.mockResolvedValue('goldOnDark');
      const { result } = renderHook(() => useIsBrightTheme(), { wrapper });
      await waitFor(() => expect(result.current).toBe(false));
    });

    it('returns true for goldOnWhite', async () => {
      AsyncStorage.getItem.mockResolvedValue('goldOnWhite');
      const { result } = renderHook(() => useIsBrightTheme(), { wrapper });
      await waitFor(() => expect(result.current).toBe(true));
    });

    it('returns true for paige', async () => {
      AsyncStorage.getItem.mockResolvedValue('paige');
      const { result } = renderHook(() => useIsBrightTheme(), { wrapper });
      await waitFor(() => expect(result.current).toBe(true));
    });
  });
});
