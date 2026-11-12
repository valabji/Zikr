jest.mock('@/locales/i18n', () => ({
  t: (k) => k,
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
  arabicContentStyle: () => ({}),
}));

jest.mock('@/utils/books/DailyHadith', () => ({
  getDailyHadith: jest.fn(async () => ({
    bookId: 'nawawi40',
    bookNameAr: 'الأربعون النووية',
    bookNameEn: "An-Nawawi's 40 Hadith",
    n: 1,
    textAr: 'إنما الأعمال بالنيات',
    textEn: 'Actions are judged by motives.',
  })),
}));

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import DailyHadithCard from '@/components/azkar/DailyHadithCard';
import { getDailyHadith } from '@/utils/books/DailyHadith';

describe('DailyHadithCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDailyHadith.mockResolvedValue({
      bookId: 'nawawi40',
      bookNameAr: 'الأربعون النووية',
      bookNameEn: "An-Nawawi's 40 Hadith",
      n: 1,
      textAr: 'إنما الأعمال بالنيات',
      textEn: 'Actions are judged by motives.',
    });
  });

  it('renders the hadith text and source reference', async () => {
    const { getByTestId, getByText } = render(<DailyHadithCard />);
    await act(async () => {});
    expect(getByTestId('daily-hadith-text')).toBeTruthy();
    expect(getByText('Actions are judged by motives.')).toBeTruthy();
    expect(getByText(/An-Nawawi's 40 Hadith #1/)).toBeTruthy();
  });

  it('toggles expanded state when tapped', async () => {
    const { getByTestId } = render(<DailyHadithCard />);
    await act(async () => {});
    const card = getByTestId('daily-hadith-card');
    const text = getByTestId('daily-hadith-text');
    expect(text.props.numberOfLines).toBe(3);
    fireEvent.press(card);
    expect(text.props.numberOfLines).toBeUndefined();
  });

  it('renders nothing when there is no hadith available', async () => {
    getDailyHadith.mockResolvedValue(null);
    const { queryByTestId } = render(<DailyHadithCard />);
    await act(async () => {});
    expect(queryByTestId('daily-hadith-card')).toBeNull();
  });
});
