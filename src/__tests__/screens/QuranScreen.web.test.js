import React from 'react';
import { act, render } from '@testing-library/react-native';
import QuranScreen from '@/screens/quran/QuranScreen.web';
import { loadLayouts } from '@/utils/quran/layoutData';

jest.mock('@/utils/quran/layoutData', () => ({ loadLayouts: jest.fn() }));
jest.mock('@/constants/Colors', () => ({ useColors: () => ({}) }));
jest.mock('@/locales/i18n', () => ({ t: key => key }));
jest.unstable_mockModule('@/screens/quran/QuranScreen.js', () => ({
  default: ({ navigation }) => {
    const { Text } = require('react-native');
    return <Text>{navigation.name}</Text>;
  },
}));

it('waits for the layout chunks before rendering the reader and forwards navigation', async () => {
  let finish;
  loadLayouts.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const screen = render(<QuranScreen navigation={{ name: 'Reader ready' }} />);
  await act(async () => {});
  expect(screen.getByLabelText('quran.loading')).toBeTruthy();
  expect(screen.queryByText('Reader ready')).toBeNull();
  await act(async () => finish());
  expect(await screen.findByText('Reader ready')).toBeTruthy();
  expect(screen.queryByLabelText('quran.loading')).toBeNull();
});
