jest.mock('../../locales/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'quran.wbwEmpty': 'No word-by-word data available.',
    };
    return translations[key] || key;
  }),
}));

jest.mock('../../constants/Fonts', () => ({
  textStyles: {
    base: {},
  },
}));

import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuranWordTooltip from '../../components/QuranWordTooltip';

const colors = {
  surface: '#fff',
  accent: '#0a0',
  text: '#000',
  textSecondary: '#444',
};

describe('QuranWordTooltip', () => {
  it('renders nothing when word is null', () => {
    const { queryByTestId, toJSON } = render(
      <QuranWordTooltip word={null} onClose={() => {}} colors={colors} />
    );
    expect(toJSON()).toBeNull();
    expect(queryByTestId('quran-word-tooltip')).toBeNull();
  });

  it('renders the Arabic word and English gloss when word is provided', () => {
    const word = { ar: 'بِسْمِ', en: 'In the name', x: 100, y: 200 };
    const { getByText, getByTestId } = render(
      <QuranWordTooltip word={word} onClose={() => {}} colors={colors} />
    );
    expect(getByTestId('quran-word-tooltip')).toBeTruthy();
    expect(getByText('بِسْمِ')).toBeTruthy();
    expect(getByText('In the name')).toBeTruthy();
  });

  it('falls back to the wbwEmpty translation when en gloss is missing', () => {
    const word = { ar: 'بِسْمِ', en: null, x: 100, y: 200 };
    const { getByText } = render(
      <QuranWordTooltip word={word} onClose={() => {}} colors={colors} />
    );
    expect(getByText('No word-by-word data available.')).toBeTruthy();
  });

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn();
    const word = { ar: 'بِسْمِ', en: 'In the name', x: 100, y: 200 };
    const { getByTestId } = render(
      <QuranWordTooltip word={word} onClose={onClose} colors={colors} />
    );
    fireEvent.press(getByTestId('quran-word-tooltip-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clamps the bubble position near screen edges', () => {
    const word = { ar: 'بِسْمِ', en: 'In the name', x: 5, y: 30 };
    const { getByTestId } = render(
      <QuranWordTooltip word={word} onClose={() => {}} colors={colors} />
    );
    const bubble = getByTestId('quran-word-tooltip');
    const style = Array.isArray(bubble.props.style) ? Object.assign({}, ...bubble.props.style) : bubble.props.style;
    expect(style.left).toBeGreaterThanOrEqual(10);
    expect(style.top).toBeGreaterThanOrEqual(10);
  });
});
