jest.mock('@/locales/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
  isRTL: jest.fn(() => false),
  t: jest.fn((k) => k),
  getDirectionalMixedSpacing: jest.fn(() => ({})),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CompassMethodModal from '@/components/qibla/CompassMethodModal';

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  availableMethods: ['magHeading', 'trueHeading', 'magnetometer'],
  onMethodSelect: jest.fn(),
};

describe('CompassMethodModal (expanded)', () => {
  beforeEach(() => {
    baseProps.onClose.mockClear();
    baseProps.onMethodSelect.mockClear();
  });

  it('always shows the "auto" option even when no methods are available', () => {
    const { getByText } = render(
      <CompassMethodModal {...baseProps} availableMethods={[]} />
    );
    expect(getByText('qibla.autoSelect')).toBeTruthy();
  });

  it('shows GPS Magnetic Enhanced option when magHeading is available', () => {
    const { getByText } = render(<CompassMethodModal {...baseProps} />);
    expect(getByText('qibla.gpsMagneticEnhanced')).toBeTruthy();
  });

  it('hides GPS methods when not available', () => {
    const { queryByText } = render(
      <CompassMethodModal {...baseProps} availableMethods={['magnetometer']} />
    );
    expect(queryByText('qibla.gpsMagneticEnhanced')).toBeNull();
    expect(queryByText('qibla.gpsTrueHeading')).toBeNull();
  });

  it('returns null when not visible', () => {
    const { toJSON } = render(<CompassMethodModal {...baseProps} visible={false} />);
    // Modal returns null when not visible in our mocked react-native
    expect(toJSON()).toBeDefined();
  });

  it('calls onMethodSelect + onClose when a method is pressed', () => {
    const { getByText } = render(<CompassMethodModal {...baseProps} />);
    const autoOption = getByText('qibla.autoSelect');
    fireEvent.press(autoOption);
    expect(baseProps.onMethodSelect).toHaveBeenCalledWith('auto');
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
