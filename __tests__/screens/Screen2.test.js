import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Screen2 from '../../screens/Screen2';
import { Provider } from 'react-redux';
import { mystore } from '../../redux/store';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock Sound utils
jest.mock('../../utils/Sounds');

describe('Screen2', () => {
  const mockRoute = {
    params: { name: 'أذكار الصباح' } // Use a valid category from Azkar data
  };

  const renderWithProvider = (component) => {
    return render(
      <Provider store={mystore}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    // Clear store and navigation mocks before each test
    mystore.dispatch({ type: 'RESET_STATE' });
    mockNavigation.navigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = renderWithProvider(<Screen2 route={mockRoute} />);
    expect(getByTestId('screen2-container')).toBeTruthy();
  });

  it('displays Azkar items', () => {
    const { getAllByTestId } = renderWithProvider(<Screen2 route={mockRoute} />);
    const azkarItems = getAllByTestId('azkar-item');
    expect(azkarItems.length).toBeGreaterThan(0);
  });

  it('displays count information', () => {
    const { getAllByTestId } = renderWithProvider(<Screen2 route={mockRoute} />);
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
