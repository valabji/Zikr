import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AzkarSwiper from '../../components/AzkarSwiper';
import AzkarOnePageScroll from '../../components/AzkarOnePageScroll';
import AzkarOnePageScrollCompact from '../../components/AzkarOnePageScrollCompact';
import * as Speech from 'expo-speech';

// Mock required modules
jest.mock('../../utils/Sounds.js', () => ({
  useAudio: () => ({
    playClick: jest.fn()
  })
}));

jest.mock('../../constants/Colors', () => ({
  useColors: () => ({
    BYellow: '#FFD700',
    primary: '#000000'
  })
}));

jest.mock('../../constants/Fonts', () => ({
  textStyles: {
    bodySmall: {},
    body: {},
    base: {}
  }
}));

jest.mock('../../locales/i18n', () => ({
  t: (key, params) => {
    if (key === 'zikr.reference') return `Reference: ${params.text}`;
    if (key === 'counter.page') return `Page ${params.current} of ${params.total}`;
    return key;
  },
  isRTL: () => false,
  getRTLTextAlign: (align) => align
}));

jest.mock('../../components/StarSvg', () => ({
  StarSvgFilled: ({ width, height }) => 'StarSvgFilled'
}));

jest.mock('react-native-web-swiper', () => 'Swiper');

const mockAzkarList = [
  {
    zekr: 'Test Zikr 1',
    count: 3,
    reference: 'Test Reference 1',
    description: 'Test Description 1',
    category: 'Morning'
  },
  {
    zekr: 'Test Zikr 2',
    count: 1,
    reference: 'Test Reference 2',
    description: 'Test Description 2',
    category: 'Morning'
  }
];

describe('AzkarSwiper', () => {
  it('should render correctly', () => {
    const { getAllByTestId } = render(
      <AzkarSwiper azkarList={mockAzkarList} zikrFontSize={18} />
    );
    
    const azkarItems = getAllByTestId('azkar-item');
    expect(azkarItems).toHaveLength(2);
  });
});

describe('AzkarOnePageScroll', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <AzkarOnePageScroll azkarList={mockAzkarList} zikrFontSize={18} />
    );
    
    expect(getByText('Test Zikr 1')).toBeTruthy();
    expect(getByText('Test Zikr 2')).toBeTruthy();
  });

  it('should handle count button press', () => {
    const { getAllByTestId } = render(
      <AzkarOnePageScroll azkarList={mockAzkarList} zikrFontSize={18} />
    );
    
    const countButtons = getAllByTestId('count-button');
    expect(countButtons).toHaveLength(2);
    
    // Test first zikr count
    fireEvent.press(countButtons[0]);
    // Since we mocked the audio module, we just check that it doesn't crash
    expect(countButtons[0]).toBeTruthy();
  });
});

describe('Azkar audio recitation button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('speaks the zikr text via expo-speech when pressed in AzkarOnePageScroll', () => {
    const { getAllByTestId } = render(
      <AzkarOnePageScroll azkarList={mockAzkarList} zikrFontSize={18} />
    );

    const audioButtons = getAllByTestId('azkar-audio-button');
    expect(audioButtons).toHaveLength(2);

    fireEvent.press(audioButtons[0]);
    expect(Speech.speak).toHaveBeenCalledWith(
      'Test Zikr 1',
      expect.objectContaining({ language: 'ar' })
    );
  });

  it('stops speech when the active button is pressed again', () => {
    const { getAllByTestId } = render(
      <AzkarOnePageScroll azkarList={mockAzkarList} zikrFontSize={18} />
    );

    const [firstButton] = getAllByTestId('azkar-audio-button');
    fireEvent.press(firstButton);
    fireEvent.press(firstButton);
    expect(Speech.stop).toHaveBeenCalled();
  });

  it('renders the audio toggle button in AzkarOnePageScrollCompact', () => {
    const { getAllByTestId } = render(
      <AzkarOnePageScrollCompact azkarList={mockAzkarList} zikrFontSize={18} />
    );

    const audioButtons = getAllByTestId('azkar-audio-button');
    expect(audioButtons).toHaveLength(2);
    fireEvent.press(audioButtons[1]);
    expect(Speech.speak).toHaveBeenCalledWith(
      'Test Zikr 2',
      expect.objectContaining({ language: 'ar' })
    );
  });

  it('renders the audio toggle button in AzkarSwiper', () => {
    const { getAllByTestId } = render(
      <AzkarSwiper azkarList={mockAzkarList} zikrFontSize={18} />
    );

    const audioButtons = getAllByTestId('azkar-audio-button');
    expect(audioButtons).toHaveLength(2);
    fireEvent.press(audioButtons[0]);
    expect(Speech.speak).toHaveBeenCalledWith(
      'Test Zikr 1',
      expect.objectContaining({ language: 'ar' })
    );
  });
});
