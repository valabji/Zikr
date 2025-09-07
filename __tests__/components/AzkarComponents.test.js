import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AzkarSwiper from '../../components/AzkarSwiper';
import AzkarOnePageScroll from '../../components/AzkarOnePageScroll';

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
    description: 'Test Description 1'
  },
  {
    zekr: 'Test Zikr 2',
    count: 1,
    reference: 'Test Reference 2',
    description: 'Test Description 2'
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
