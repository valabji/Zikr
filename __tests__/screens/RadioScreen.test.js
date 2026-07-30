import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RadioScreen from '../../screens/RadioScreen';
import RadioService from '../../utils/RadioService';
import {
  getStations, getOfflineStations, markStationOffline, markStationOnline,
} from '../../utils/RadioStations';
import { loadRadioFavorites, toggleRadioFavorite } from '../../utils/RadioFavorites';

const mockNavigation = { goBack: jest.fn(), toggleDrawer: jest.fn(), navigate: jest.fn() };

jest.mock('../../locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: (key) => key,
  isRTL: () => false,
  getRTLTextAlign: () => 'left',
  getDirectionalSpacing: jest.fn(() => ({})),
  getDirectionalMixedSpacing: jest.fn(() => ({})),
}));

jest.mock('../../constants/Colors', () => ({
  useColors: () => ({
    BGreen: '#008000', DGreen: '#006400', BYellow: '#FFFF00', DYellow: '#B8860B',
    primary: '#000000', primaryDark: '#003300', accent: '#B8860B',
    text: '#111111', textSecondary: '#666666', background: '#FFFFFF', surface: '#F4F4F4',
    overlayBackground: '#00000088',
  }),
  useIsBrightTheme: () => false,
  getItemColors: () => null,
}));

jest.mock('../../utils/RadioService', () => {
  const state = { activeStation: null, isPlaying: false, isBuffering: false, failedStationId: null };
  const listeners = new Set();
  return {
    __esModule: true,
    default: {
      __state: state,
      __emit: () => listeners.forEach((fn) => fn({ ...state })),
      _state: () => ({ ...state }),
      subscribe: jest.fn((fn) => { listeners.add(fn); fn({ ...state }); return () => listeners.delete(fn); }),
      playStation: jest.fn(),
      toggle: jest.fn(),
      stop: jest.fn(),
    },
  };
});

jest.mock('../../utils/RadioStations', () => ({
  getStations: jest.fn(() => Promise.resolve([
    { id: 1, name: 'Alpha', streamUrl: 'https://s/1' },
    { id: 2, name: 'Beta', streamUrl: 'https://s/2' },
  ])),
  getStationSubtitle: jest.fn(() => ''),
  getOfflineStations: jest.fn(() => Promise.resolve(new Set())),
  markStationOffline: jest.fn(),
  markStationOnline: jest.fn(),
}));

jest.mock('../../utils/RadioFavorites', () => ({
  loadRadioFavorites: jest.fn(() => Promise.resolve([])),
  toggleRadioFavorite: jest.fn(() => Promise.resolve([])),
  subscribeRadioFavorites: jest.fn(() => () => {}),
}));

describe('RadioScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RadioService.__state.activeStation = null;
    RadioService.__state.isPlaying = false;
    RadioService.__state.isBuffering = false;
    RadioService.__state.failedStationId = null;
    getOfflineStations.mockResolvedValue(new Set());
    getStations.mockResolvedValue([
      { id: 1, name: 'Alpha', streamUrl: 'https://s/1' },
      { id: 2, name: 'Beta', streamUrl: 'https://s/2' },
    ]);
    loadRadioFavorites.mockResolvedValue([]);
  });

  it('renders the station list', async () => {
    const { getByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    expect(getByTestId('radio-screen')).toBeTruthy();
    await waitFor(() => {
      expect(getByTestId('station-1')).toBeTruthy();
      expect(getByTestId('station-2')).toBeTruthy();
    });
  });

  it('plays a station when an inactive row is tapped', async () => {
    const { getByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-1')).toBeTruthy());
    fireEvent.press(getByTestId('station-1'));
    expect(RadioService.playStation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, streamUrl: 'https://s/1' }),
    );
  });

  it('toggles instead of replaying when the active station is tapped', async () => {
    RadioService.__state.activeStation = { id: 1, name: 'Alpha', streamUrl: 'https://s/1' };
    const { getByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-1')).toBeTruthy());
    fireEvent.press(getByTestId('station-1'));
    expect(RadioService.toggle).toHaveBeenCalled();
    expect(RadioService.playStation).not.toHaveBeenCalled();
  });

  it('toggles a favorite when the heart is tapped', async () => {
    const { getByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('fav-1')).toBeTruthy());
    fireEvent.press(getByTestId('fav-1'));
    expect(toggleRadioFavorite).toHaveBeenCalledWith(1);
  });

  it('filters to favorites only on the favorites tab', async () => {
    loadRadioFavorites.mockResolvedValue([2]);
    const { getByTestId, queryByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-1')).toBeTruthy());
    fireEvent.press(getByTestId('radio-tab-favorites'));
    await waitFor(() => {
      expect(queryByTestId('station-1')).toBeNull();
      expect(getByTestId('station-2')).toBeTruthy();
    });
  });

  it('filters the list by the search query', async () => {
    const { getByTestId, queryByTestId } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-1')).toBeTruthy());
    fireEvent.changeText(getByTestId('radio-search'), 'beta');
    await waitFor(() => {
      expect(queryByTestId('station-1')).toBeNull();
      expect(getByTestId('station-2')).toBeTruthy();
    });
  });

  it('marks unreachable stations as offline', async () => {
    getOfflineStations.mockResolvedValue(new Set([2]));
    const { getByTestId, queryAllByText } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-2')).toBeTruthy());
    await waitFor(() => expect(queryAllByText('radio.offline').length).toBe(1));
  });

  it('badges the tapped station when playback fails and syncs the cache', async () => {
    const { getByTestId, queryAllByText } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('station-1')).toBeTruthy());
    RadioService.__state.activeStation = { id: 1, name: 'Alpha', streamUrl: 'https://s/1' };
    RadioService.__state.failedStationId = 1;
    act(() => RadioService.__emit());
    await waitFor(() => expect(queryAllByText('radio.offline').length).toBe(1));
    expect(markStationOffline).toHaveBeenCalledWith('en', 1);
  });

  it('clears the offline badge once the station actually plays', async () => {
    getOfflineStations.mockResolvedValue(new Set([2]));
    const { queryAllByText } = render(<RadioScreen navigation={mockNavigation} />);
    await waitFor(() => expect(queryAllByText('radio.offline').length).toBe(1));
    RadioService.__state.activeStation = { id: 2, name: 'Beta', streamUrl: 'https://s/2' };
    RadioService.__state.isPlaying = true;
    act(() => RadioService.__emit());
    await waitFor(() => expect(queryAllByText('radio.offline').length).toBe(0));
    expect(markStationOnline).toHaveBeenCalledWith('en', 2);
  });
});
