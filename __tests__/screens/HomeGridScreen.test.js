jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../locales/i18n', () => ({
  t: (key) => key,
  isRTL: jest.fn(() => false),
  setLanguage: jest.fn(() => Promise.resolve()),
  getCurrentLanguage: jest.fn(() => 'en'),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeGridScreen from '../../screens/HomeGridScreen';

describe('HomeGridScreen', () => {
  const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };

  beforeEach(() => {
    navigation.navigate.mockClear();
  });

  it('renders the grid without the tab bar items', async () => {
    const { getByTestId, queryByTestId } = render(<HomeGridScreen navigation={navigation} />);
    expect(getByTestId('home-grid-screen')).toBeTruthy();
    await waitFor(() => expect(getByTestId('quran-screen')).toBeTruthy());
    expect(queryByTestId('settings-screen')).toBeNull();
    expect(queryByTestId('islamic-calendar-screen-link')).toBeNull();
    expect(queryByTestId('wird-planner-screen-link')).toBeNull();
    expect(queryByTestId('hifz-tracker-screen-link')).toBeNull();
  });

  it('navigates when a card is pressed', async () => {
    const { getByTestId } = render(<HomeGridScreen navigation={navigation} />);
    await waitFor(() => expect(getByTestId('quran-screen')).toBeTruthy());
    fireEvent.press(getByTestId('quran-screen'));
    expect(navigation.navigate).toHaveBeenCalledWith('Quran');
  });

  it('routes qibla to prayer settings when no location is set', async () => {
    const { getByTestId } = render(<HomeGridScreen navigation={navigation} />);
    await waitFor(() => expect(getByTestId('qibla-screen')).toBeTruthy());
    fireEvent.press(getByTestId('qibla-screen'));
    expect(navigation.navigate).toHaveBeenCalledWith('UnifiedPrayerSettings');
  });
});
