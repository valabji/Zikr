import React from 'react';
import { render } from '@testing-library/react-native';
import { PatternSvg } from '@/components/svg/PatternSvg';

describe('PatternSvg', () => {
  it('renders correctly with provided props', () => {
    const { getByTestId } = render(
      <PatternSvg 
        color="#000000" 
        width={100}
        testID="hbg-component"
      />
    );
    
    const component = getByTestId('hbg-component');
    expect(component).toBeTruthy();
  });

  it('renders without crashing with different widths', () => {
    expect(() => render(
      <PatternSvg 
        color="#000000" 
        width={200}
        testID="hbg-component"
      />
    )).not.toThrow();
  });
});
