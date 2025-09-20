import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import CustomHeader from '../../components/CHeader';

describe('CustomHeader', () => {
  const mockNavigation = {
    toggleDrawer: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in home mode', () => {
    const { getByTestId } = render(
      <CustomHeader 
        isHome={true} 
        title="Test Title" 
        navigation={mockNavigation}
        testID="header-container" 
      />
    );
    expect(getByTestId('header-container')).toBeTruthy();
  });

  it('calls toggleDrawer when menu button is pressed in home mode', () => {
    const { getByTestId } = render(
      <CustomHeader 
        isHome={true} 
        title="Test Title" 
        navigation={mockNavigation} 
      />
    );
    
    const menuButton = getByTestId('menu-button');
    fireEvent.press(menuButton);
    expect(mockNavigation.toggleDrawer).toHaveBeenCalled();
  });

  it('renders title correctly', () => {
    const testTitle = "Test Header";
    const { getByText } = render(
      <CustomHeader 
        isHome={true} 
        title={testTitle} 
        navigation={mockNavigation} 
      />
    );
    expect(getByText(testTitle)).toBeTruthy();
  });

  it('renders with custom Right component when provided', () => {
    const CustomRight = () => <View testID="custom-right" />;
    const { getByTestId } = render(
      <CustomHeader 
        Right={CustomRight} 
        title="Test Title" 
        navigation={mockNavigation} 
      />
    );
    
    expect(getByTestId('custom-right')).toBeTruthy();
  });

  it('renders back button and handles navigation when not in home mode', () => {
    const { getByTestId } = render(
      <CustomHeader 
        isHome={false} 
        title="Test Title" 
        navigation={mockNavigation} 
      />
    );
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('applies correct background colors in gradient', () => {
    const { UNSAFE_getByType } = render(
      <CustomHeader 
        isHome={true} 
        title="Test Title" 
        navigation={mockNavigation} 
      />
    );
    
    const gradient = UNSAFE_getByType('LinearGradient');
    expect(gradient.props.colors).toEqual(['#003C34', '#002520']);
  });
});
