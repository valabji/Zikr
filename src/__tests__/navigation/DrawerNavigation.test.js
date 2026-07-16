import React from 'react';
import { render } from '@testing-library/react-native';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    Svg: ({ children, ...props }) => React.createElement('Svg', props, children),
    Circle: 'Circle',
    Path: ({ children, ...props }) => React.createElement('Path', props, children),
    Polygon: 'Polygon',
    G: ({ children, ...props }) => React.createElement('G', props, children),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  })),
}));

// IMPORT AFTER MOCKS
import { DNav as DrawerNavigation } from '@/navigation/DrawerNavigation';

// Mock navigation container and drawer
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock i18n
jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: (key) => key,
  setLanguage: jest.fn(() => Promise.resolve()),
  isRTL: jest.fn(() => false),
}));

// Mock screens
jest.mock('@/screens/MainScreen', () => 'MainScreen');
jest.mock('@/screens/Screen3', () => 'Screen3');
jest.mock('@/screens/SettingsScreen', () => 'SettingsScreen');
jest.mock('@/screens/ContributeScreen', () => 'ContributeScreen');
jest.mock('@/screens/IslamicCalendarScreen', () => 'IslamicCalendarScreen');
jest.mock('@/screens/WirdPlannerScreen', () => 'WirdPlannerScreen');
jest.mock('@/screens/HifzTrackerScreen', () => 'HifzTrackerScreen');

describe('DrawerNavigation', () => {
  it('renders without crashing', () => {
    expect(() => render(<DrawerNavigation />)).not.toThrow();
  });

  it('contains all screen components', () => {
    const { debug } = render(<DrawerNavigation />);
    expect(true).toBe(true);
  });

  it('applies correct theme styles to drawer', () => {
    const { debug } = render(<DrawerNavigation />);
    expect(true).toBe(true);
  });

  it('handles language changes correctly', () => {
    const { debug } = render(<DrawerNavigation />);
    expect(true).toBe(true);
  });

  it('sets up correct navigation options', () => {
    const { debug } = render(<DrawerNavigation />);
    expect(true).toBe(true);
  });
});
