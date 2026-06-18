import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Screen3 from '../../screens/Screen3';
import { Provider } from 'react-redux';
import { mystore } from '../../redux/store';

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  toggleDrawer: jest.fn()
};

// Mock the tasbih store with a deterministic active counter
jest.mock('../../utils/TasbihStore', () => ({
  useTasbih: () => ({
    active: { id: 'a', count: 5, target: 33, rounds: 1, total: 100 },
    increment: jest.fn(() => ({ completed: false })),
    resetActive: jest.fn(),
    setActiveId: jest.fn(),
    addCounter: jest.fn(),
    renameCounter: jest.fn(),
    setTarget: jest.fn(),
    deleteCounter: jest.fn(),
    moveCounter: jest.fn(),
    setDailyGoal: jest.fn(),
    stats: {
      todayTotal: 5,
      dailyGoal: 1000,
      goalPct: 1,
      last7Days: [
        { date: '2026-06-12', count: 0 },
        { date: '2026-06-13', count: 0 },
        { date: '2026-06-14', count: 0 },
        { date: '2026-06-15', count: 0 },
        { date: '2026-06-16', count: 0 },
        { date: '2026-06-17', count: 0 },
        { date: '2026-06-18', count: 5 },
      ],
    },
    state: {
      counters: [{ id: 'a', count: 5, target: 33, rounds: 1, total: 100, nameKey: 'counter.presets.subhanAllah' }],
      activeId: 'a',
    },
  }),
  getCounterDisplayName: () => 'counter.presets.subhanAllah',
}));

// Mock Sound utils
jest.mock('../../utils/Sounds', () => ({
  useAudio: () => ({
    playClick: jest.fn(),
    volume: 0.9,
    setClickVolume: jest.fn()
  })
}));

// Mock i18n functions
jest.mock('../../locales/i18n', () => ({
  t: (key) => key,
  getDirectionalMixedSpacing: jest.fn(() => ({})),
  getDirectionalSpacing: jest.fn(() => ({})),
  isRTL: jest.fn(() => false),
}));

// Mock colors and themes
jest.mock('../../constants/Colors', () => ({
  useColors: () => ({
    BGreen: '#008000',
    BYellow: '#FFFF00',
    DGreen: '#006400',
    DYellow: '#B8860B',
    white: '#FFFFFF',
    primary: '#000000',
    shadowColor: '#000000',
    surface: '#FFFFFF',
    overlayBackground: 'rgba(0, 0, 0, 0.7)',
    accent: '#B8860B',
    text: '#000000',
    textSecondary: '#666666',
  }),
  useIsBrightTheme: () => false,
}));

describe('Screen3', () => {
  const renderWithProvider = (component) => {
    return render(
      <Provider store={mystore}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    // Clear navigation mocks before each test
    mockNavigation.goBack.mockClear();
    mockNavigation.toggleDrawer.mockClear();
  });

  it('renders correctly', () => {
    const { root } = renderWithProvider(
      <Screen3 navigation={mockNavigation} />
    );
    // Just check that it rendered without error
    expect(root).toBeTruthy();
  });

  it('shows the active counter value', () => {
    const { getByTestId } = renderWithProvider(
      <Screen3 navigation={mockNavigation} />
    );
    expect(String(getByTestId('tasbih-counter-value').props.children)).toBe('5');
  });
});
