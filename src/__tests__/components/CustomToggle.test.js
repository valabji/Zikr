import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomToggle from '@/components/CustomToggle';

describe('CustomToggle', () => {
  it('renders without crashing', () => {
    const tree = render(<CustomToggle value={false} onValueChange={jest.fn()} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('calls onValueChange with the toggled value on press', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_root } = render(
      <CustomToggle value={false} onValueChange={onValueChange} />
    );
    // The root TouchableOpacity is the first element
    const touchable = UNSAFE_root.findByType(require('react-native').TouchableOpacity);
    fireEvent.press(touchable);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('toggles from true to false', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_root } = render(
      <CustomToggle value={true} onValueChange={onValueChange} />
    );
    const touchable = UNSAFE_root.findByType(require('react-native').TouchableOpacity);
    fireEvent.press(touchable);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('accepts custom colors and icon without erroring', () => {
    const tree = render(
      <CustomToggle
        value={true}
        onValueChange={jest.fn()}
        activeColor="#FF0000"
        inactiveColor="#00FF00"
        backgroundColor="#0000FF"
        icon="check"
        size={32}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});
