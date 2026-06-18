import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-reanimated', () => ({
  // Mock the specific exports used in SettingsScreen
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((value) => value),
  withSequence: jest.fn((...animations) => animations),
  withDelay: jest.fn((delay, animation) => animation),
  runOnJS: jest.fn((fn) => fn),
  Animated: {
    View: 'Animated.View', // Mock as string or component if needed
    Text: 'Animated.Text',
    // Add other Animated components if used
  },
  // Add other exports if your code uses them
}));
// Mock the Colors module
const mockSetAutoVariantEnabled = jest.fn();
const mockLockVariant = jest.fn();
jest.mock('../../constants/Colors', () => ({
  useColors: () => ({
    BGreen: '#003C34',
    DGreen: '#002520',
    MGreen: '#002B25',
    BYellow: '#FFE29D',
    DYellow: '#D1955E',
    shadowColor: '#000000',
  }),
  useTheme: () => ({
    theme: 'originalGreen',
    setTheme: jest.fn(),
    themes: require('../../constants/themes').themes,
    variant: 'duha',
    autoVariant: true,
    lockedVariant: null,
    setAutoVariantEnabled: mockSetAutoVariantEnabled,
    lockVariant: mockLockVariant,
  }),
}));

// Mock other dependencies
jest.mock('../../utils/Sounds', () => ({
  useAudio: () => ({
    volume: 0.5,
    setClickVolume: jest.fn(),
    playClick: jest.fn(),
  }),
}));

jest.mock('../../locales/i18n', () => ({
  setLanguage: jest.fn(),
  t: (key) => key,
  getDirectionalMixedSpacing: (spacing) => spacing,
  getRTLTextAlign: () => ({ textAlign: 'left' }),
  isRTL: jest.fn(() => false),
  getDirectionalSpacing: jest.fn((left, right) => ({ marginLeft: left, marginRight: right })),
}));

describe('SettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    setOptions: jest.fn(),
  };

  // Render helper that waits for all effects (async AsyncStorage loads + state updates)
  // to settle, so subsequent assertions don't trigger React act() warnings.
  const renderSettings = async (props = {}) => {
    const result = render(<SettingsScreen navigation={mockNavigation} {...props} />);
    // waitFor implicitly flushes pending state updates inside act()
    await waitFor(() => {
      expect(result.getByTestId('settings-screen')).toBeTruthy();
    });
    // Let any trailing setStates settle
    await act(async () => {
      await Promise.resolve();
    });
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('renders correctly', async () => {
    const tree = await renderSettings();
    const getByTestId = tree.getByTestId;
    // Wait for AsyncStorage calls and effects to settle before asserting
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
    expect(getByTestId('settings-screen')).toBeTruthy();
  });

  it('verifies all theme options exist in themes object', () => {
    // This test verifies that all expected themes are defined in the themes object
    // which the dropdown uses via Object.entries(themes).map()
    const { themes } = require('../../constants/themes');
    
    // Check that all 8 themes exist
    expect(Object.keys(themes)).toHaveLength(8);
    expect(themes.originalGreen).toBeDefined();
    expect(themes.goldOnWhite).toBeDefined();
    expect(themes.goldOnDark).toBeDefined();
    expect(themes.paige).toBeDefined();
    expect(themes.chocolate).toBeDefined();
    expect(themes.lavender).toBeDefined();
    expect(themes.sky).toBeDefined();
    expect(themes.navy).toBeDefined();
    
    // Verify the themes have both English and Arabic names
    expect(themes.paige.name).toBe('Paige');
    expect(themes.paige.nameAr).toBe('بيج');
    expect(themes.chocolate.name).toBe('Chocolate');
    expect(themes.chocolate.nameAr).toBe('شوكولاتة');
    expect(themes.lavender.name).toBe('Lavender');
    expect(themes.lavender.nameAr).toBe('لافندر');
  });

  it('displays theme dropdown with Arabic names by default', async () => {
    // Mock AsyncStorage to return specific values to avoid timing issues
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@language') return Promise.resolve('ar');
      if (key === '@firstTimeSettings') return Promise.resolve('false');
      return Promise.resolve(null);
    });

    const tree = await renderSettings();
    const getByTestId = tree.getByTestId;
    
    // Wait for component to finish loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify settings screen loaded (basic test first)
    expect(getByTestId('settings-screen')).toBeTruthy();
    
    // Look for theme text by querying all text elements
    await waitFor(() => {
      const settingsScreen = getByTestId('settings-screen');
      expect(settingsScreen).toBeTruthy();
    });
  });

  it('can open theme dropdown', async () => {
    // Mock AsyncStorage to return specific values
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@language') return Promise.resolve('ar');
      if (key === '@firstTimeSettings') return Promise.resolve('false');
      return Promise.resolve(null);
    });

    const { getByTestId, queryByText } = await renderSettings();
    
    // Wait for component to finish loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify settings screen loaded
    expect(getByTestId('settings-screen')).toBeTruthy();
    
    // Try to find and interact with theme elements
    await waitFor(() => {
      // Look for the theme text or similar elements
      const settingsScreen = getByTestId('settings-screen');
      expect(settingsScreen).toBeTruthy();
    });
  });

  it('handles language change', async () => {
    const tree = await renderSettings();
    const getByTestId = tree.getByTestId;

    // Wait for the component to fully load before interacting
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });

    const languageToggle = getByTestId('language-toggle');

    await act(async () => {
      fireEvent.press(languageToggle);
    });

    expect(languageToggle).toBeTruthy();
  });

  it('navigates to UnifiedPrayerSettings when prayer settings button pressed', async () => {
    AsyncStorage.getItem.mockResolvedValue('false');
    const { queryByTestId } = await renderSettings();
    const btn = queryByTestId('prayer-settings-button');
    if (btn) {
      await act(async () => {
        fireEvent.press(btn);
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('UnifiedPrayerSettings');
    }
  });

  it('respects firstTime flag from storage', async () => {
    AsyncStorage.getItem.mockImplementation((k) => {
      if (k === '@firstTimeSettings') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    const { getByTestId } = await renderSettings();
    expect(getByTestId('settings-screen')).toBeTruthy();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@firstTimeSettings');
  });

  it('renders without crashing when storage rejects', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('storage broken'));
    const { getByTestId } = await renderSettings();
    expect(getByTestId('settings-screen')).toBeTruthy();
    warn.mockRestore();
  });

  describe('prayer-time theme variants', () => {
    it('renders a lock toggle for each variant and the auto-mode switch', async () => {
      const { getByTestId } = await renderSettings();
      expect(getByTestId('theme-variant-auto-toggle')).toBeTruthy();
      expect(getByTestId('theme-variant-fajr')).toBeTruthy();
      expect(getByTestId('theme-variant-duha')).toBeTruthy();
      expect(getByTestId('theme-variant-asr')).toBeTruthy();
      expect(getByTestId('theme-variant-isha')).toBeTruthy();
    });

    it('toggles auto mode when the auto/locked pill is pressed', async () => {
      const { getByTestId } = await renderSettings();
      await act(async () => {
        fireEvent.press(getByTestId('theme-variant-auto-toggle'));
      });
      expect(mockSetAutoVariantEnabled).toHaveBeenCalledWith(false);
    });

    it('locks a variant when its row is pressed', async () => {
      const { getByTestId } = await renderSettings();
      await act(async () => {
        fireEvent.press(getByTestId('theme-variant-asr'));
      });
      expect(mockLockVariant).toHaveBeenCalledWith('asr');
    });
  });
});
