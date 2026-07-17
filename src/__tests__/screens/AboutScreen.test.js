import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking, Share } from 'react-native';
import AboutScreen from '@/screens/AboutScreen';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.1.17' } } }));

jest.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));

jest.mock('@/constants/Colors', () => ({
  useColors: jest.fn(() => ({
    BGreen: '#2E7D32',
    DGreen: '#1B5E20',
    BYellow: '#FFF9C4',
  })),
}));

jest.mock('@/components/LogoSvg', () => ({ LogoSvg: 'LogoSvg' }));

jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: jest.fn((key, params) => {
    const map = {
      'about.title': 'About',
      'about.version': 'Version {version}',
      'app.name': 'Zikr App',
      'about.description': 'Zikr is a free Islamic companion.',
      'about.developer': 'About the Developer',
      'about.developerName': 'Abdalrahman Valabji',
      'about.developerRole': 'Software Developer',
      'about.developerLink': 'valabji.com',
      'about.links': 'Links',
      'about.website': 'Website',
      'about.github': 'Source Code',
      'about.playStore': 'Google Play',
      'about.shareApp': 'Share App',
      'about.creditsLink': 'Credits, Licenses & Acknowledgements',
      'about.creditsLinkDesc': 'Data sources, open-source libraries and thank-yous',
      'about.rights': '© 2020–{year} Abdalrahman Valabji · MIT License',
      'about.madeWith': 'Made with care for the Ummah',
      'share.message': 'Download Zikr',
    };
    let s = map[key] || key;
    if (params) Object.keys(params).forEach((k) => { s = s.replace(`{${k}}`, params[k]); });
    return s;
  }),
  isRTL: jest.fn(() => false),
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

describe('AboutScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
    jest.spyOn(Share, 'share').mockResolvedValue();
  });

  it('renders the about content', () => {
    const { getByText, getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    expect(getByTestId('about-screen-root')).toBeTruthy();
    expect(getByText('About')).toBeTruthy();
    expect(getByText('Zikr App')).toBeTruthy();
    expect(getByText('Version 1.1.17')).toBeTruthy();
    expect(getByText('About the Developer')).toBeTruthy();
    expect(getByText('Abdalrahman Valabji')).toBeTruthy();
    expect(getByText('Software Developer')).toBeTruthy();
  });

  it('renders external link rows', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    expect(getByTestId('about-link-website')).toBeTruthy();
    expect(getByTestId('about-link-github')).toBeTruthy();
    expect(getByTestId('about-link-playstore')).toBeTruthy();
    expect(getByTestId('about-link-share')).toBeTruthy();
  });

  it('opens the website link', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-link-website'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://zikr.valabji.com');
  });

  it('opens the github link', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-link-github'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://github.com/valabji/Zikr');
  });

  it('opens the play store link', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-link-playstore'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://play.google.com/store/apps/details?id=com.valabji.zikr');
  });

  it('opens the developer profile link', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-developer-link'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://valabji.com');
  });

  it('shares the app with a message', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-link-share'));
    expect(Share.share).toHaveBeenCalledWith({ message: 'Download Zikr' });
  });

  it('navigates to the Credits subpage', () => {
    const { getByTestId } = render(<AboutScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('about-credits-link'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Credits');
  });
});
