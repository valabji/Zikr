jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('@/locales/i18n', () => ({
  t: (key) => key,
  isRTL: jest.fn(() => false),
  setLanguage: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/screens/HomeGridScreen', () => 'HomeGridScreen');
jest.mock('@/screens/azkar/MainScreen', () => 'MainScreen');
jest.mock('@/screens/TasbihScreen', () => 'TasbihScreen');
jest.mock('@/screens/SettingsScreen', () => 'SettingsScreen');
jest.mock('@/screens/prayer/PrayerTimesScreen', () => 'PrayerTimesScreen');
jest.mock('@/screens/QiblaScreen', () => 'QiblaScreen');
jest.mock('@/screens/quran/QuranScreen', () => 'QuranScreen');
jest.mock('@/screens/books/BooksScreen', () => 'BooksScreen');
jest.mock('@/screens/RadioScreen', () => 'RadioScreen');
jest.mock('@/screens/IslamicCalendarScreen', () => 'IslamicCalendarScreen');
jest.mock('@/screens/WirdPlannerScreen', () => 'WirdPlannerScreen');
jest.mock('@/screens/HifzTrackerScreen', () => 'HifzTrackerScreen');

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { TabNavigation } from '@/navigation/TabNavigation';

describe('TabNavigation', () => {
  it('renders without crashing', async () => {
    expect(() => render(<TabNavigation />)).not.toThrow();
    await act(async () => {});
  });
});
