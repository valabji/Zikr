import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import TelemetryScreen from '@/screens/TelemetryScreen';
import {
  isTelemetryEnabled, setTelemetryEnabled, getTelemetryCategories, setTelemetryCategory,
} from '@/utils/firebase/telemetry';

jest.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));

jest.mock('@/constants/Colors', () => ({
  useColors: jest.fn(() => ({
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    accent: '#2E7D32',
    primary: '#FFFFFF',
  })),
}));

jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  t: jest.fn((key) => {
    const map = {
      'telemetry.title': 'Usage Data & Privacy',
      'telemetry.intro': 'Zikr collects a small amount of anonymous usage data.',
      'telemetry.collected': 'What is collected',
      'telemetry.collectedScreens': 'Screens you visit',
      'telemetry.collectedEvents': 'Feature usage',
      'telemetry.collectedDevice': 'App version & platform',
      'telemetry.collectedAuto': 'Device model, OS & coarse region',
      'telemetry.notCollected': 'What is never collected',
      'telemetry.notCollectedBody': 'No names, emails or accounts.',
      'telemetry.why': 'Why it matters',
      'telemetry.whyBody': 'It guides fixes and what gets built next.',
      'telemetry.toggle': 'Share anonymous usage data',
      'telemetry.toggleDesc': 'Turn off to stop sending any analytics from this device',
      'telemetry.optOutTitle': 'Please don\'t turn this off',
      'telemetry.optOutMessage': 'This anonymous data is the only feedback Zikr gets.',
      'telemetry.optOutKeep': 'Keep sharing',
      'telemetry.optOutConfirm': 'Turn off anyway',
      'telemetry.screensPlea': 'Screen visits show what people use.',
      'telemetry.eventsPlea': 'Feature usage shows what needs work.',
      'telemetry.devicePlea': 'Version and platform make bugs traceable.',
    };
    return map[key] || key;
  }),
  isRTL: jest.fn(() => false),
  getDirectionalMixedSpacing: jest.fn((spacing) => spacing),
  getRTLTextAlign: jest.fn((align) => align),
}));

jest.mock('@/utils/firebase/telemetry', () => ({
  isTelemetryEnabled: jest.fn(() => true),
  setTelemetryEnabled: jest.fn(),
  getTelemetryCategories: jest.fn(() => ({ screens: true, events: true, device: true })),
  setTelemetryCategory: jest.fn(),
}));

jest.mock('@/components/CustomHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomHeader({ title }) {
    return <Text testID="header-title">{title}</Text>;
  };
});

describe('TelemetryScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    isTelemetryEnabled.mockReturnValue(true);
    getTelemetryCategories.mockReturnValue({ screens: true, events: true, device: true });
  });

  it('renders the telemetry content', () => {
    const { getByText, getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    expect(getByTestId('telemetry-screen-root')).toBeTruthy();
    expect(getByTestId('header-title').props.children).toBe('Usage Data & Privacy');
    expect(getByText('What is collected')).toBeTruthy();
    expect(getByText('Screens you visit')).toBeTruthy();
    expect(getByText('Feature usage')).toBeTruthy();
    expect(getByText('App version & platform')).toBeTruthy();
    expect(getByText('Device model, OS & coarse region')).toBeTruthy();
    expect(getByText('What is never collected')).toBeTruthy();
    expect(getByText('Why it matters')).toBeTruthy();
    expect(getByText('Share anonymous usage data')).toBeTruthy();
  });

  it('shows a per-category plea and disables only on confirm', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    const cases = [
      ['telemetry-screens-toggle', 'screens', 'Screen visits show what people use.'],
      ['telemetry-events-toggle', 'events', 'Feature usage shows what needs work.'],
      ['telemetry-device-toggle', 'device', 'Version and platform make bugs traceable.'],
    ];
    cases.forEach(([testID, category, message]) => {
      fireEvent.press(getByTestId(testID));
      expect(setTelemetryCategory).not.toHaveBeenCalledWith(category, false);
      const [title, body, buttons] = alertSpy.mock.calls.at(-1);
      expect(title).toBe('Please don\'t turn this off');
      expect(body).toBe(message);
      buttons.find((b) => b.style === 'destructive').onPress();
      expect(setTelemetryCategory).toHaveBeenCalledWith(category, false);
    });
  });

  it('keeps a category on when the plea is cancelled', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('telemetry-screens-toggle'));
    expect(setTelemetryCategory).not.toHaveBeenCalled();
  });

  it('re-enables a disabled category', () => {
    getTelemetryCategories.mockReturnValue({ screens: false, events: true, device: true });
    const { getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    expect(getByTestId('telemetry-screens-toggle').props.accessibilityState.checked).toBe(false);
    fireEvent.press(getByTestId('telemetry-screens-toggle'));
    expect(setTelemetryCategory).toHaveBeenCalledWith('screens', true);
  });

  it('shows a plea before opting out and only disables on confirm', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    fireEvent.press(getByTestId('telemetry-toggle'));
    expect(setTelemetryEnabled).not.toHaveBeenCalled();
    const [title, , buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Please don\'t turn this off');
    buttons.find((b) => b.style === 'destructive').onPress();
    expect(setTelemetryEnabled).toHaveBeenCalledWith(false);
  });

  it('disables category toggles when the master toggle is off', () => {
    isTelemetryEnabled.mockReturnValue(false);
    const { getByTestId } = render(<TelemetryScreen navigation={mockNavigation} />);
    const screensToggle = getByTestId('telemetry-screens-toggle');
    expect(screensToggle.props.accessibilityState.disabled).toBe(true);
    expect(screensToggle.props.accessibilityState.checked).toBe(false);
    fireEvent.press(getByTestId('telemetry-toggle'));
    expect(setTelemetryEnabled).toHaveBeenCalledWith(true);
  });
});
