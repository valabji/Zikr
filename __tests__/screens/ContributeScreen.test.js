import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Alert, Clipboard } from 'react-native';
import ContributeScreen from '../../screens/ContributeScreen';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Linking: {
    openURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  Clipboard: {
    setString: jest.fn(),
  },
}));

jest.mock('../../constants/Colors', () => ({
  useColors: jest.fn(() => ({
    BGreen: '#2E7D32',
    DGreen: '#1B5E20',
    BYellow: '#FFF9C4',
  })),
}));

jest.mock('../../locales/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'navigation.contribute': 'Contribute',
      'contribute.title': 'Help Us Improve Zikr',
      'contribute.description': 'Your contribution helps make Zikr better for everyone.',
      'contribute.forUsers': 'For Users',
      'contribute.usersDescription': 'Help us verify references...',
      'contribute.downloadExcel': 'Download Excel Sheet',
      'contribute.contactUs': 'Contact Us',
      'contribute.referenceChecking': 'Reference Checking',
      'contribute.translation': 'Translation',
      'contribute.suggestions': 'Suggestions',
      'contribute.bugReports': 'Bug Reports',
      'contribute.copied': 'Copied!',
      'contribute.emailCopied': 'Email address copied to clipboard',
      'contribute.forDevelopers': 'For Developers',
      'contribute.developersDescription': 'Zikr is open source!...',
      'contribute.openGitHub': 'View on GitHub',
      'contribute.thankYou': 'Thank you for helping us...',
      'contribute.error': 'Error',
      'contribute.linkError': 'Could not open the link.',
      'contribute.emailError': 'Could not open email client.',
    };
    return translations[key] || key;
  }),
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

    expect(getByTestId('header-title')).toBeTruthy();
    expect(getByText('Help Us Improve Zikr')).toBeTruthy();
    expect(getByText('For Users')).toBeTruthy();
    expect(getByText('For Developers')).toBeTruthy();
    expect(getByText('Download Excel Sheet')).toBeTruthy();
    expect(getByText('Contact Us')).toBeTruthy();
    expect(getByText('Reference Checking')).toBeTruthy();
    expect(getByText('Translation')).toBeTruthy();
    expect(getByText('Suggestions')).toBeTruthy();
    expect(getByText('Bug Reports')).toBeTruthy();
    expect(getByText('View on GitHub')).toBeTruthy();
  });

  it('opens Excel sheet when download button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Download Excel Sheet'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBPd_n5b0kvOR4ImV-vmh3509yAvDFAjysFeMvJMYcUJzd8H2jY8MQEd_1rPjBFwSr1_SRmpdNsvzq/pub?output=xlsx'
      );
    });
  });

  it('opens reference checking email when reference checking button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Reference Checking'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:zikr@valabji.com?subject=Zikr Reference Checking'
      );
    });
  });

  it('opens translation email when translation button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Translation'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:zikr@valabji.com?subject=Zikr Translation Help'
      );
    });
  });

  it('opens suggestions email when suggestions button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Suggestions'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:zikr@valabji.com?subject=Zikr App Suggestions'
      );
    });
  });

  it('opens bug report email when bug reports button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Bug Reports'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:zikr@valabji.com?subject=Zikr Bug Report'
      );
    });
  });

  it('copies email address when copy button is pressed', async () => {
    const { getByTestId } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    const copyButton = getByTestId('copy-email');
    fireEvent.press(copyButton);

    await waitFor(() => {
      expect(Clipboard.setString).toHaveBeenCalledWith('zikr@valabji.com');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copied!',
        'Email address copied to clipboard'
      );
    });
  });

  it('opens GitHub when GitHub button is pressed', async () => {
    Linking.openURL.mockResolvedValueOnce(true);
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('View on GitHub'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://github.com/valabji/Zikr'
      );
    });
  });

  it('shows error alert when link fails to open', async () => {
    Linking.openURL.mockRejectedValueOnce(new Error('Failed to open'));
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('View on GitHub'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not open the link.'
      );
    });
  });

  it('shows error alert when email fails to open', async () => {
    Linking.openURL.mockRejectedValueOnce(new Error('Failed to open'));
    
    const { getByText } = render(
      <ContributeScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Send Email'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not open email client.'
      );
    });
  });
});
