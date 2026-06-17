import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BooksScreen from '../../screens/BooksScreen';

const mockNavigation = {
  goBack: jest.fn(),
  toggleDrawer: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('../../locales/i18n', () => ({
  t: (key) => key,
  isRTL: () => false,
  getDirectionalSpacing: jest.fn(() => ({})),
  getDirectionalMixedSpacing: jest.fn(() => ({})),
  getRTLTextAlign: () => 'left',
  arabicContentStyle: (overrides = {}) => ({
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
    ...overrides,
  }),
}));

jest.mock('../../constants/Colors', () => ({
  useColors: () => ({
    BGreen: '#008000',
    DGreen: '#006400',
    BYellow: '#FFFF00',
    DYellow: '#B8860B',
    white: '#FFFFFF',
    primary: '#000000',
    shadowColor: '#000000',
    accent: '#B8860B',
    text: '#111111',
    textSecondary: '#666666',
    background: '#FFFFFF',
    surface: '#F4F4F4',
    overlayBackground: '#00000088',
  }),
  useIsBrightTheme: () => false,
}));

describe('BooksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('renders the library list of books', async () => {
    const { getByTestId } = render(<BooksScreen navigation={mockNavigation} />);
    expect(getByTestId('books-screen')).toBeTruthy();
    await waitFor(() => {
      expect(getByTestId('book-nawawi40')).toBeTruthy();
      expect(getByTestId('book-qudsi40')).toBeTruthy();
    });
  });

  it('opens a book into the reader when tapped', async () => {
    const { getByTestId, findByTestId } = render(<BooksScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getByTestId('book-nawawi40')).toBeTruthy());
    fireEvent.press(getByTestId('book-nawawi40'));
    expect(await findByTestId('books-reader')).toBeTruthy();
    expect(await findByTestId('books-pager')).toBeTruthy();
  });
});
