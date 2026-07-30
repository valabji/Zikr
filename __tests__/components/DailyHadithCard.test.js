jest.mock('../../locales/i18n', () => ({
  t: (k) => k,
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
  arabicContentStyle: () => ({}),
}));

jest.mock('../../utils/DailyHadith', () => ({
  getDailyHadith: jest.fn(() => ({
    bookId: 'nawawi40',
    bookNameAr: 'الأربعون النووية',
    bookNameEn: "An-Nawawi's 40 Hadith",
    n: 1,
    textAr: 'إنما الأعمال بالنيات',
    textEn: 'Actions are judged by motives.',
  })),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import DailyHadithCard from '../../components/DailyHadithCard';
import { getDailyHadith } from '../../utils/DailyHadith';

describe('DailyHadithCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDailyHadith.mockReturnValue({
      bookId: 'nawawi40',
      bookNameAr: 'الأربعون النووية',
      bookNameEn: "An-Nawawi's 40 Hadith",
      n: 1,
      textAr: 'إنما الأعمال بالنيات',
      textEn: 'Actions are judged by motives.',
    });
  });

  it('renders the hadith text and source reference', () => {
    const { getByTestId, getByText } = render(<DailyHadithCard />);
    expect(getByTestId('daily-hadith-text')).toBeTruthy();
    expect(getByText('Actions are judged by motives.')).toBeTruthy();
    expect(getByText(/An-Nawawi's 40 Hadith #1/)).toBeTruthy();
  });

  it('toggles expanded state when tapped', () => {
    const { getByTestId } = render(<DailyHadithCard />);
    const card = getByTestId('daily-hadith-card');
    const text = getByTestId('daily-hadith-text');
    expect(text.props.numberOfLines).toBe(3);
    fireEvent.press(card);
    expect(text.props.numberOfLines).toBeUndefined();
  });

  it('renders nothing when there is no hadith available', () => {
    getDailyHadith.mockReturnValue(null);
    const { queryByTestId } = render(<DailyHadithCard />);
    expect(queryByTestId('daily-hadith-card')).toBeNull();
  });
});
