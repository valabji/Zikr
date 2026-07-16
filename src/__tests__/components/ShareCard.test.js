import React from 'react';
import { render } from '@testing-library/react-native';
import ShareCard from '@/components/ShareCard';
import { FONT_FAMILY } from '@/constants/Fonts';

jest.mock('@/constants/Colors', () => ({
  useColors: () => ({
    background: '#fff',
    accent: '#caa',
    text: '#111',
    textSecondary: '#555',
  }),
}));

jest.mock('@/locales/i18n', () => ({
  t: (key) => key,
}));

const fontOf = (node) => {
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style)
    : node.props.style;
  return style.fontFamily;
};

describe('ShareCard font selection', () => {
  it('renders Azkar dhikr in the App font (Cairo)', () => {
    const { getByText } = render(
      <ShareCard content={{ arabic: 'زكر', reference: 'ref' }} />
    );
    expect(fontOf(getByText('زكر'))).toBe(FONT_FAMILY);
  });

  it('renders the embedded Azkar verse in Hafs with parentheses cleaned', () => {
    const { getByText } = render(
      <ShareCard content={{ arabic: 'زكر', quran: '(1) آية' }} />
    );
    const verse = getByText('١ آية');
    expect(fontOf(verse)).toBe('Hafs');
  });

  it('renders Quran HD segments each in their per-page QCF font', () => {
    const { getByText } = render(
      <ShareCard
        content={{
          arabicSegments: [{ text: 'ﱁ ﱂ', fontFamily: 'QCFv2_P415' }],
          reference: 'As-Sajdah 32:1',
        }}
      />
    );
    expect(fontOf(getByText('ﱁ ﱂ'))).toBe('QCFv2_P415');
  });

  it('falls back to UthmanicHafs when no QCF segments are supplied', () => {
    const plain = 'الٓمٓ';
    const { getByText } = render(
      <ShareCard
        content={{ arabicSegments: [{ text: plain, fontFamily: 'UthmanicHafs' }] }}
      />
    );
    expect(fontOf(getByText(plain))).toBe('UthmanicHafs');
  });
});
