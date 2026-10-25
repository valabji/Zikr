import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useFonts } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import App from '@/App';

jest.mock('@expo-google-fonts/cairo', () => ({ useFonts: jest.fn(), Cairo_400Regular: 1 }));
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn().mockResolvedValue() }));
jest.mock('@/utils/load', () => ({ loadResourcesAndDataAsync: jest.fn().mockResolvedValue() }));
jest.mock('@/constants/Colors', () => ({ useTheme: () => ({ isThemeLoaded: true }) }));
jest.mock('@/constants/ThemeProvider', () => ({ ThemeProvider: ({ children }) => children }));
jest.mock('@/navigation/Main', () => ({ AppContainer: () => {
  const { Text } = require('react-native');
  return <Text>App ready</Text>;
} }));
jest.mock('@/components/RTLStyleLoader', () => () => null);
jest.mock('@/utils/prayer/PrayerNotificationScheduler', () => ({ __esModule: true, default: { refresh: jest.fn() } }));
jest.mock('@/utils/notifications/NotificationService', () => ({ __esModule: true, default: { consolidatePrayerAlarms: jest.fn() } }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  require('react-native').AppState = { addEventListener: jest.fn(() => ({ remove: jest.fn() })) };
});
afterEach(() => jest.useRealTimers());

it('opens the app and hides the splash when font loading fails', async () => {
  useFonts.mockReturnValue([false, new Error('Font unavailable')]);
  const screen = render(<App />);
  await act(async () => {});
  expect(screen.getByText('App ready')).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(100); });
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

it('cleans up a pending splash timer on unmount', async () => {
  useFonts.mockReturnValue([true, null]);
  const screen = render(<App />);
  await act(async () => {});
  screen.unmount();
  await act(async () => { jest.advanceTimersByTime(100); });
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});
