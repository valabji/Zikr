jest.mock('@/locales/i18n', () => ({
  t: jest.fn((k) => k),
  getDirectionalMixedSpacing: jest.fn(() => ({})),
  getRTLTextAlign: jest.fn(() => 'left'),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QiblaInstructions from '@/components/qibla/QiblaInstructions';

const baseProps = {
  compassEnabled: true,
  isQiblaAligned: false,
  isQiblaClose: false,
  qiblaDirection: 137,
  onRetryCompass: jest.fn(),
  onNavigateToSettings: jest.fn(),
};

describe('QiblaInstructions', () => {
  beforeEach(() => {
    baseProps.onRetryCompass.mockClear();
    baseProps.onNavigateToSettings.mockClear();
  });

  it('shows compass instructions when enabled', () => {
    const { getByText } = render(<QiblaInstructions {...baseProps} />);
    expect(getByText('qibla.instructionsWithCompass')).toBeTruthy();
  });

  it('shows instructions without compass when disabled', () => {
    const { getByText } = render(
      <QiblaInstructions {...baseProps} compassEnabled={false} />
    );
    expect(getByText('qibla.instructionsWithoutCompass')).toBeTruthy();
  });

  it('shows aligned alignment text when aligned', () => {
    const { getByText } = render(<QiblaInstructions {...baseProps} isQiblaAligned />);
    expect(getByText('qibla.aligned')).toBeTruthy();
  });

  it('shows close alignment text when close', () => {
    const { getByText } = render(<QiblaInstructions {...baseProps} isQiblaClose />);
    expect(getByText('qibla.closeToQibla')).toBeTruthy();
  });

  it('shows the warning + retry button only when compass is disabled', () => {
    const { getByText, queryByText } = render(
      <QiblaInstructions {...baseProps} compassEnabled={false} />
    );
    expect(getByText('qibla.retry')).toBeTruthy();
    fireEvent.press(getByText('qibla.retry'));
    expect(baseProps.onRetryCompass).toHaveBeenCalled();
    expect(queryByText('qibla.compassAccuracy')).toBeNull();
  });

  it('shows accuracy warning only when compass is enabled', () => {
    const { getByText } = render(<QiblaInstructions {...baseProps} compassEnabled />);
    expect(getByText('qibla.compassAccuracy')).toBeTruthy();
  });

  it('navigates to settings when change location pressed', () => {
    const { getByText } = render(<QiblaInstructions {...baseProps} />);
    fireEvent.press(getByText('qibla.changeLocation'));
    expect(baseProps.onNavigateToSettings).toHaveBeenCalled();
  });
});
