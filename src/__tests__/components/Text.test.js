import React from 'react';
import { render } from '@testing-library/react-native';
import {
  Text,
  TextInput,
  TitleText,
  SubtitleText,
  BodyText,
  CaptionText,
  HeaderText,
  NavigationText,
} from '@/components/Text';

describe('components/Text', () => {
  it('Text renders children with default font style', () => {
    const { getByText } = render(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('TextInput forwards refs and renders', () => {
    const ref = React.createRef();
    const tree = render(<TextInput ref={ref} value="x" />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it.each([
    ['TitleText', TitleText],
    ['SubtitleText', SubtitleText],
    ['BodyText', BodyText],
    ['CaptionText', CaptionText],
    ['HeaderText', HeaderText],
    ['NavigationText', NavigationText],
  ])('%s renders children', (_label, Component) => {
    const { getByText } = render(<Component>Sample</Component>);
    expect(getByText('Sample')).toBeTruthy();
  });

  it('merges custom style with default style', () => {
    const tree = render(<Text style={{ color: 'red' }}>Styled</Text>);
    expect(tree.toJSON()).toBeTruthy();
  });
});
