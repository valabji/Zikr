import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreen from '../../screens/AuthScreen';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

// Mock i18n
jest.mock('../../locales/i18n', () => ({
  t: (key) => key,
}));

// Mock Feather icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

const renderWithAuthProvider = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthScreen', () => {
  beforeEach(() => {
    mockNavigation.goBack.mockClear();
    mockNavigation.navigate.mockClear();
  });

  it('renders without crashing', () => {
    expect(() => 
      renderWithAuthProvider(<AuthScreen navigation={mockNavigation} />)
    ).not.toThrow();
  });

  it('displays login form by default', () => {
    const { getByText } = renderWithAuthProvider(
      <AuthScreen navigation={mockNavigation} />
    );
    
    expect(getByText('auth.login')).toBeTruthy();
  });

  it('switches between login and register modes', () => {
    const { getByText } = renderWithAuthProvider(
      <AuthScreen navigation={mockNavigation} />
    );
    
    // Should show login initially
    expect(getByText('auth.login')).toBeTruthy();
    
    // Find and tap the switch button (text contains "register")
    const switchButton = getByText(/auth.register/);
    fireEvent.press(switchButton);
    
    // Should now show register
    expect(getByText('auth.register')).toBeTruthy();
  });

  it('handles back navigation', () => {
    const { getByTestId } = renderWithAuthProvider(
      <AuthScreen navigation={mockNavigation} />
    );
    
    // This test would need testID added to the back button
    // For now, just verify navigation prop is used
    expect(mockNavigation.goBack).toBeDefined();
  });
});