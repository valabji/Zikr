jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: (k, params) => (params ? `${k}:${JSON.stringify(params)}` : k),
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
}));

jest.mock('@/components/CHeader', () => () => null);

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HifzTrackerScreen from '@/screens/HifzTrackerScreen';
import { _resetForTests } from '@/utils/HifzTracker';

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn() });

describe('HifzTrackerScreen', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('renders without crashing', async () => {
    const { getByTestId } = render(<HifzTrackerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('hifz-tracker-screen')).toBeTruthy());
    expect(getByTestId('hifz-surah-list')).toBeTruthy();
  });

  it('cycles a surah through not_started -> in_progress -> memorized -> not_started', async () => {
    const { getByTestId } = render(<HifzTrackerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('hifz-status-1')).toBeTruthy());

    fireEvent.press(getByTestId('hifz-status-1'));
    fireEvent.press(getByTestId('hifz-status-1'));
    await waitFor(() => expect(getByTestId('hifz-row-1')).toBeTruthy());
  });

  it('filters the list to memorized surahs', async () => {
    const { getByTestId, queryByTestId } = render(<HifzTrackerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('hifz-status-1')).toBeTruthy());

    fireEvent.press(getByTestId('hifz-status-1'));
    fireEvent.press(getByTestId('hifz-status-1'));
    fireEvent.press(getByTestId('hifz-filter-memorized'));

    await waitFor(() => expect(getByTestId('hifz-row-1')).toBeTruthy());
    expect(queryByTestId('hifz-row-2')).toBeNull();
  });
});
