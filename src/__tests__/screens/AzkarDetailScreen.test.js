jest.unmock('@/utils/AzkarStore');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AzkarDetailScreen from '@/screens/AzkarDetailScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

// Mock Sound utils
jest.mock('@/utils/Sounds');

describe('AzkarDetailScreen', () => {
  const mockRoute = {
    params: { name: 'أذكار الصباح' } // Use a valid category from Azkar data
  };

  beforeEach(() => {
    mockNavigation.navigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(<AzkarDetailScreen route={mockRoute} />);
    expect(getByTestId('azkar-detail-container')).toBeTruthy();
  });

  it('displays Azkar items', () => {
    const { getAllByTestId } = render(<AzkarDetailScreen route={mockRoute} />);
    const azkarItems = getAllByTestId('azkar-item');
    expect(azkarItems.length).toBeGreaterThan(0);
  });

  it('opens the item sort sheet and reorders without losing items', () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(<AzkarDetailScreen route={mockRoute} />);
    const before = getAllByTestId('azkar-item').length;

    fireEvent.press(getByTestId('item-sort-toggle'));
    expect(getByTestId('azkar-sort-sheet')).toBeTruthy();
    expect(queryByTestId('sort-mode-alpha')).toBeNull();

    fireEvent.press(getByTestId('sort-mode-manual'));
    expect(getByTestId('sort-up-0')).toBeTruthy();

    fireEvent.press(getByTestId('sort-down-0'));
    expect(getAllByTestId('azkar-item')).toHaveLength(before);
  });

  it('displays count information', () => {
    const { getAllByTestId } = render(<AzkarDetailScreen route={mockRoute} />);
    const countButtons = getAllByTestId('count-button');
    
    if (countButtons.length > 0) {
      // Count should be in format "current / total" like "0 / 3"
      // React Native may render this as an array of children
      const children = countButtons[0].props.children;
      if (Array.isArray(children)) {
        // Join the array and check the pattern
        const countText = children.join('');
        expect(countText).toMatch(/^\d+ \/ \d+$/);
      } else {
        // If it's a string, check directly
        expect(children).toMatch(/^\d+ \/ \d+$/);
      }
    }
  });
});
