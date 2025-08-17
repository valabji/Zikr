import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('SettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    expect(getByTestId('settings-screen')).toBeTruthy();
  });

  it('handles language change', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} />
    );
    
    const languageToggle = getByTestId('language-toggle');
    fireEvent.press(languageToggle);
    
    // Verify AsyncStorage was called to save the new language setting
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
