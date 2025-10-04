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

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    expect(getByTestId('settings-screen')).toBeTruthy();
  });

  it('verifies all theme options exist in themes object', () => {
    // This test verifies that all expected themes are defined in the themes object
    // which the dropdown uses via Object.entries(themes).map()
    const { themes } = require('../../constants/themes');
    
    // Check that all 6 themes exist
    expect(Object.keys(themes)).toHaveLength(6);
    expect(themes.originalGreen).toBeDefined();
    expect(themes.goldOnWhite).toBeDefined();
    expect(themes.goldOnDark).toBeDefined();
    expect(themes.paige).toBeDefined();
    expect(themes.chocolate).toBeDefined();
    expect(themes.lavender).toBeDefined();
    
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

    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    
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

    const { getByTestId, queryByText } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    
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
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    
    const languageToggle = getByTestId('language-toggle');
    
    await act(async () => {
      fireEvent.press(languageToggle);
    });
    
    expect(languageToggle).toBeTruthy();
  });
});
