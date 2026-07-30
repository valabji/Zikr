import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MushafLine } from '../../components/MushafLine';

jest.mock('../../assets/quran/data/words.json', () => ({}));

const line = {
  words: [
    { vk: '2:1', ar: 'ابج', type: 'word' },
    { vk: '2:1', ar: 'دهو', type: 'word' },
  ],
};

const baseProps = {
  line,
  fontFamily: 'UthmanicHafs',
  qcfActive: false,
  colors: { text: '#000', accent: '#123456' },
  fontScale: 1,
  mushafFontSize: 20,
  mushafLineHeight: 30,
  mushafSpaceExtra: 0,
  playingAyahKey: null,
  playingWordIdx: null,
  playingWordMistake: false,
  onAyahPress: jest.fn(),
  onAyahLongPress: jest.fn(),
  customLineSize: false,
  wordTooltipEnabled: false,
  onWordPress: jest.fn(),
};

const layoutEvent = (lines) => ({ nativeEvent: { lines } });

describe('MushafLine truncation detection', () => {
  it('does not report when the full text is laid out', () => {
    const onLineTruncated = jest.fn();
    const { getByTestId } = render(<MushafLine {...baseProps} onLineTruncated={onLineTruncated} />);
    fireEvent(getByTestId('mushaf-line'), 'textLayout', layoutEvent([{ text: 'ابج دهو' }]));
    expect(onLineTruncated).not.toHaveBeenCalled();
  });

  it('reports the rendered font size when the laid-out text is ellipsized', () => {
    const onLineTruncated = jest.fn();
    const { getByTestId } = render(<MushafLine {...baseProps} onLineTruncated={onLineTruncated} />);
    fireEvent(getByTestId('mushaf-line'), 'textLayout', layoutEvent([{ text: 'ابج …' }]));
    expect(onLineTruncated).toHaveBeenCalledWith(20);
  });

  it('ignores a one-character deficit (ellipsis replacing a single glyph)', () => {
    const onLineTruncated = jest.fn();
    const { getByTestId } = render(<MushafLine {...baseProps} onLineTruncated={onLineTruncated} />);
    fireEvent(getByTestId('mushaf-line'), 'textLayout', layoutEvent([{ text: 'ابج ده…' }]));
    expect(onLineTruncated).not.toHaveBeenCalled();
  });

  it('does not attach detection in custom line size mode', () => {
    const onLineTruncated = jest.fn();
    const { getByTestId } = render(
      <MushafLine {...baseProps} customLineSize onLineTruncated={onLineTruncated} />
    );
    expect(getByTestId('mushaf-line').props.onTextLayout).toBeUndefined();
  });
});
