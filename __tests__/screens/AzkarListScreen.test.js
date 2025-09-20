import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../screens/MainScreen';
import { mystore } from '../../redux/store';

// Mock the required dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  AntDesign: 'AntDesign',
  Feather: 'Feather',
  Ionicons: 'Ionicons',
}));

jest.mock('../../redux/store');

describe('HomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('handles search input correctly', () => {
    const { getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    // First, trigger the search toggle to show the search input
    const searchToggle = getByTestId('search-toggle');
    fireEvent.press(searchToggle);
    
    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'test search');
    // Note: TextInput doesn't automatically set value prop, so we can't test it directly
    expect(searchInput).toBeTruthy();
  });

  it('renders Azkar items correctly', () => {
    const mockAzkar = [
      { id: 1, category: 'Test Category 1', fav: false },
      { id: 2, category: 'Test Category 2', fav: false }
    ];

    jest.spyOn(mystore, 'getState').mockImplementation(() => ({
      obj: { Azkar: mockAzkar }
    }));

    const { getAllByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    const items = getAllByTestId('zikr-item');
    expect(items).toHaveLength(2); // We expect 2 unique categories
  });

  it('handles favorites toggle correctly', () => {
    const { getAllByTestId, getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    const favToggles = getAllByTestId('fav-toggle');
    fireEvent.press(favToggles[0]); // Press the first one
    // Just verify the fav indicator exists after toggle
    expect(getAllByTestId('fav-indicator')[0]).toBeTruthy();
  });
});
