import React from 'react';
import { render } from '@testing-library/react-native';
import ContributeScreen from '../../screens/ContributeScreen';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('../../constants/Colors', () => ({
  useColors: jest.fn(() => ({
    BGreen: '#2E7D32',
    DGreen: '#1B5E20',
    BYellow: '#FFF9C4',
  })),
}));

jest.mock('../../constants/Fonts', () => ({
  textStyles: {},
}));

jest.mock('../../locales/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'navigation.contribute': 'Contribute',
      'contribute.title': 'Help Us Improve Zikr',
      'contribute.description': 'Your contribution helps make Zikr better for everyone.',
      'contribute.forUsers': 'For Users',
      'contribute.usersDescription': 'Help us verify references and translations.',
      'contribute.downloadExcel': 'Download Excel Sheet',
      'contribute.contactUs': 'Contact Us',
      'contribute.referenceChecking': 'Reference Checking',
      'contribute.translation': 'Translation',
      'contribute.suggestions': 'Suggestions',
      'contribute.bugReports': 'Bug Reports',
      'contribute.forDevelopers': 'For Developers',
      'contribute.developersDescription': 'Contribute to the codebase and help develop new features.',
      'contribute.openGitHub': 'View on GitHub',
      'contribute.thankYou': 'Thank you for your contribution!',
    };
    return translations[key] || key;
  }),
  getDirectionalMixedSpacing: jest.fn((spacing) => spacing),
  getRTLTextAlign: jest.fn((align) => align),
}));

jest.mock('../../components/CHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CHeader({ title }) {
    return <Text testID="header-title">{title}</Text>;
  };
});

describe('ContributeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    // Check header
    expect(getByTestId('header-title')).toBeTruthy();
    expect(getByText('Contribute')).toBeTruthy();

    // Check main sections
    expect(getByText('Help Us Improve Zikr')).toBeTruthy();
    expect(getByText('Your contribution helps make Zikr better for everyone.')).toBeTruthy();

    // Check user section
    expect(getByText('For Users')).toBeTruthy();
    expect(getByText('Help us verify references and translations.')).toBeTruthy();
    expect(getByText('Download Excel Sheet')).toBeTruthy();
    expect(getByText('Contact Us')).toBeTruthy();

    // Check email options
    expect(getByText('Reference Checking')).toBeTruthy();
    expect(getByText('Translation')).toBeTruthy();
    expect(getByText('Suggestions')).toBeTruthy();
    expect(getByText('Bug Reports')).toBeTruthy();

    // Check developer section
    expect(getByText('For Developers')).toBeTruthy();
    expect(getByText('Contribute to the codebase and help develop new features.')).toBeTruthy();
    expect(getByText('View on GitHub')).toBeTruthy();

    // Check thank you message
    expect(getByText('Thank you for your contribution!')).toBeTruthy();
  });

  it('displays email address correctly', () => {
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    expect(getByText('zikr@valabji.com')).toBeTruthy();
  });

  it('has copy email button', () => {
    const { getByTestId } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    expect(getByTestId('copy-email')).toBeTruthy();
  });

  it('renders all interactive buttons', () => {
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    // Check that all buttons are rendered
    expect(getByText('Download Excel Sheet')).toBeTruthy();
    expect(getByText('Reference Checking')).toBeTruthy();
    expect(getByText('Translation')).toBeTruthy();
    expect(getByText('Suggestions')).toBeTruthy();
    expect(getByText('Bug Reports')).toBeTruthy();
    expect(getByText('View on GitHub')).toBeTruthy();
  });
});
