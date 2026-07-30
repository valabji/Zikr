import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import {
  SettingsRow,
  SettingsToggle,
  SettingsSegmented,
  SettingsSelect,
  SettingsSection,
  SettingsButton,
  SettingsCallout,
} from '../../components/settings';

describe('settings primitives', () => {
  it('SettingsRow fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SettingsRow testID="row" label="Hello" description="World" onPress={onPress} chevron />
    );
    fireEvent.press(getByTestId('row'));
    expect(onPress).toHaveBeenCalled();
  });

  it('SettingsToggle flips value', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = render(
      <SettingsToggle testID="tg" value={false} onValueChange={onValueChange} />
    );
    fireEvent.press(getByTestId('tg'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('SettingsSegmented selects an option', () => {
    const onChange = jest.fn();
    const opts = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const { getByTestId } = render(
      <SettingsSegmented
        value="a"
        options={opts}
        onChange={onChange}
        getTestID={(o) => `seg-${o.id}`}
      />
    );
    fireEvent.press(getByTestId('seg-b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('SettingsSelect opens and chooses', () => {
    const onChange = jest.fn();
    const opts = [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }];
    const { getByTestId, getByText } = render(
      <SettingsSelect
        triggerTestID="sel"
        title="Pick"
        label="Choice"
        value="x"
        options={opts}
        onChange={onChange}
      />
    );
    fireEvent.press(getByTestId('sel'));
    fireEvent.press(getByText('Y'));
    expect(onChange).toHaveBeenCalledWith('y');
  });

  it('SettingsSection renders children', () => {
    const { getByText } = render(
      <SettingsSection title="Group">
        <Text>child-a</Text>
        <Text>child-b</Text>
      </SettingsSection>
    );
    expect(getByText('child-a')).toBeTruthy();
    expect(getByText('child-b')).toBeTruthy();
  });

  it('SettingsButton fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SettingsButton testID="btn" label="Go" onPress={onPress} />
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalled();
  });

  it('SettingsCallout renders body', () => {
    const { getByText } = render(
      <SettingsCallout tone="warning" title="Heads up" body="Something" />
    );
    expect(getByText('Heads up')).toBeTruthy();
    expect(getByText('Something')).toBeTruthy();
  });
});
