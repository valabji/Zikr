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

// Mock Sound utils
jest.mock('../../utils/Sounds', () => ({
  useAudio: () => ({
    playClick: jest.fn(),
    volume: 0.9,
    setClickVolume: jest.fn()
  })
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
    const { getByText } = renderWithProvider(
      <Screen3 navigation={mockNavigation} />
    );
    expect(getByText('0')).toBeTruthy();
  });

  it('handles counter press correctly', async () => {
    const { getByText } = renderWithProvider(
      <Screen3 navigation={mockNavigation} />
    );
    
    const countButton = getByText('0');
    fireEvent(countButton, 'pressIn');
    
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('handles multiple presses correctly', async () => {
    const { getByText } = renderWithProvider(
      <Screen3 navigation={mockNavigation} />
    );
    
    const countButton = getByText('0');
    fireEvent(countButton, 'pressIn');
    fireEvent(countButton, 'pressIn');
    fireEvent(countButton, 'pressIn');
    
    await waitFor(() => {
      expect(getByText('3')).toBeTruthy();
    });
  });
});
