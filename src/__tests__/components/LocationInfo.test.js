jest.mock('@/locales/i18n', () => ({
  t: jest.fn((key) => key),
  getDirectionalMixedSpacing: jest.fn(() => ({})),
}));

jest.mock('@/components/CompassMethodModal', () => () => null);

import React from 'react';
import { render } from '@testing-library/react-native';
import LocationInfo from '@/components/LocationInfo';

const BASE_PROPS = {
  location: { city: 'Cairo', country: 'Egypt' },
  gpsLocation: null,
  usingGpsLocation: false,
  qiblaDirection: 137.5,
  currentHeading: 90,
  isQiblaAligned: false,
  isQiblaClose: false,
  compassEnabled: true,
  compassMethod: 'qibla.methodMagnetometer',
  compassAccuracy: 'qibla.accuracyLow',
  availableMethods: ['magnetometer'],
  onSwapCompassMethod: jest.fn(),
};

describe('LocationInfo', () => {
  it('renders the saved location when not using GPS', () => {
    const { getByText } = render(<LocationInfo {...BASE_PROPS} />);
    expect(getByText('Cairo, Egypt')).toBeTruthy();
  });

  it('shows GPS location when usingGpsLocation', () => {
    const { getByText } = render(
      <LocationInfo
        {...BASE_PROPS}
        usingGpsLocation
        gpsLocation={{ city: 'Cairo', latitude: 30.1, longitude: 31.2 }}
      />
    );
    expect(getByText(/Cairo/)).toBeTruthy();
    expect(getByText(/30.1000°, 31.2000°/)).toBeTruthy();
  });

  it('falls back to unknownLocation key when no location set', () => {
    const { getByText } = render(<LocationInfo {...BASE_PROPS} location={null} />);
    expect(getByText('qibla.unknownLocation')).toBeTruthy();
  });

  it('shows compass-disabled state', () => {
    const { getByText } = render(
      <LocationInfo {...BASE_PROPS} compassEnabled={false} />
    );
    expect(getByText('qibla.compassDisabled')).toBeTruthy();
  });

  it('shows compass-enabled state', () => {
    const { getByText } = render(<LocationInfo {...BASE_PROPS} compassEnabled />);
    expect(getByText('qibla.compassEnabled')).toBeTruthy();
  });

  it('renders the qibla bearing degree', () => {
    const { getByText } = render(<LocationInfo {...BASE_PROPS} qiblaDirection={137.5} />);
    expect(getByText('137.5°')).toBeTruthy();
  });

  it.each([
    [10, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [350, 'N'],
  ])('maps qiblaDirection=%s° to bearing %s', (deg, _expected) => {
    const tree = render(<LocationInfo {...BASE_PROPS} qiblaDirection={deg} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders accuracy as numeric value when compassAccuracy is a number', () => {
    const tree = render(<LocationInfo {...BASE_PROPS} compassAccuracy={3} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('falls back to noData when compassAccuracy is empty string', () => {
    const tree = render(<LocationInfo {...BASE_PROPS} compassAccuracy="" />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
