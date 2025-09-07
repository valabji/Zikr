import React from 'react';
import { render } from '@testing-library/react-native';
import { Hbg } from '../../components/Hbg';

describe('Hbg', () => {
  it('renders correctly with provided props', () => {
    const { getByTestId } = render(
      <Hbg 
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
      <Hbg 
        color="#000000" 
        width={200}
        testID="hbg-component"
      />
    )).not.toThrow();
  });
});
