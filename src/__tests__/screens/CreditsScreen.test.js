import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import CreditsScreen from '@/screens/CreditsScreen';

jest.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));

jest.mock('@/constants/Colors', () => ({
  useColors: jest.fn(() => ({
    BGreen: '#2E7D32',
    DGreen: '#1B5E20',
    BYellow: '#FFF9C4',
  })),
}));

jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  isRTL: jest.fn(() => false),
  t: jest.fn((key) => {
    const map = {
      'credits.title': 'Credits & Licenses',
      'credits.intro': 'Zikr stands on the work of many people and projects.',
      'credits.dataSources': 'Content & Data Sources',
      'credits.licenses': 'Open-Source Licenses',
      'credits.thanks': 'Thank You',
      'credits.thanksBody': 'To the scholars who preserved this knowledge.',
      'credits.sources.quranText': 'Quran text & Mushaf page layout',
      'credits.sources.prayerTimes': 'Prayer time calculations',
    };
    return map[key] || key;
  }),
  getDirectionalMixedSpacing: jest.fn((spacing) => spacing),
  getRTLTextAlign: jest.fn((align) => align),
}));

jest.mock('@/components/CustomHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomHeader({ title }) {
    return <Text testID="header-title">{title}</Text>;
  };
});

describe('CreditsScreen', () => {
  const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
  });

  it('renders the three sections', () => {
    const { getByText, getByTestId } = render(<CreditsScreen navigation={mockNavigation} />);
    expect(getByTestId('credits-screen-root')).toBeTruthy();
    expect(getByText('Credits & Licenses')).toBeTruthy();
    expect(getByText('Content & Data Sources')).toBeTruthy();
    expect(getByText('Open-Source Licenses')).toBeTruthy();
    expect(getByText('Thank You')).toBeTruthy();
  });

  it('lists data sources and license entries', () => {
    const { getByTestId, getAllByText } = render(<CreditsScreen navigation={mockNavigation} />);
    expect(getByTestId('credit-source-quranText')).toBeTruthy();
    expect(getByTestId('credit-source-prayerTimes')).toBeTruthy();
    expect(getByTestId('credit-license-0')).toBeTruthy();
    expect(getAllByText('MIT').length).toBeGreaterThan(0);
  });

  it('opens a data source link when it has a url', () => {
    const { getByTestId } = render(<CreditsScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('credit-source-quranText'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://qurancomplex.gov.sa');
  });
});
