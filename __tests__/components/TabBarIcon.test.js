import React from 'react';
import { render } from '@testing-library/react-native';
import TabBarIcon from '../../components/TabBarIcon';
import { useColors } from '../../constants/Colors';

// Mock the useColors hook
jest.mock('../../constants/Colors', () => ({
  useColors: jest.fn(() => ({
    BYellow: '#FFE29D',
    tabIconDefault: '#ccc',
  })),
}));

describe('TabBarIcon', () => {
  const defaultProps = {
    name: 'home',
    focused: false,
  };

  it('renders correctly with focused state', () => {
    const { UNSAFE_getByType } = render(
      <TabBarIcon 
        {...defaultProps}
        focused={true}
      />
    );
    
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.color).toBe('#FFE29D'); // BYellow
  });

  it('renders correctly with unfocused state', () => {
    const { UNSAFE_getByType } = render(
      <TabBarIcon 
        {...defaultProps}
        focused={false}
      />
    );
    
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.color).toBe('#ccc'); // tabIconDefault
  });

  it('applies correct icon name', () => {
    const iconName = 'settings';
    const { UNSAFE_getByType } = render(
      <TabBarIcon 
        {...defaultProps}
        name={iconName}
      />
    );
    
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.name).toBe(iconName);
  });

  it('applies correct style and size', () => {
    const { UNSAFE_getByType } = render(
      <TabBarIcon {...defaultProps} />
    );
    
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.style).toEqual({
      marginBottom: -3
    });
    expect(icon.props.size).toBe(30);
  });
});
