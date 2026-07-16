jest.mock('@/locales/i18n', () => ({
  t: (k) => k,
  getDirectionalMixedSpacing: () => ({}),
  getRTLTextAlign: () => 'left',
  isRTL: () => false,
}));

jest.mock('@/hooks/useQiblaCompass', () => ({
  useQiblaCompass: jest.fn(),
}));

jest.mock('@/components/QiblaCompass', () => () => null);
jest.mock('@/components/LocationInfo', () => () => null);
jest.mock('@/components/QiblaInstructions', () => () => null);
jest.mock('@/components/CHeader', () => () => null);

import React from 'react';
import { Animated } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQiblaCompass } from '@/hooks/useQiblaCompass';
import QiblaScreen from '@/screens/QiblaScreen';

const baseCompass = {
  compassEnabled: true,
  currentHeading: 0,
  compassMethod: 'magnetometer',
  compassAccuracy: 5,
  availableMethods: ['magnetometer'],
  gpsLocation: null,
  usingGpsLocation: false,
  compassRotationValue: new Animated.Value(0),
  initializeCompass: jest.fn().mockResolvedValue(true),
  cleanupCompass: jest.fn(),
  swapCompassMethod: jest.fn(),
};

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn(() => jest.fn()) });

describe('QiblaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQiblaCompass.mockReturnValue(baseCompass);
  });

  it('renders without crashing when a saved location is present', async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ latitude: 30, longitude: 31, city: 'Cairo', country: 'Egypt' })
    );
    const navigation = buildNav();
    const { toJSON } = render(<QiblaScreen navigation={navigation} />);
    await waitFor(() => {
      // After init the compass hook should have been called
      expect(baseCompass.initializeCompass).toHaveBeenCalled();
    });
    expect(toJSON()).toBeTruthy();
  });

  it('navigates to UnifiedPrayerSettings when no location is saved', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const navigation = buildNav();
    render(<QiblaScreen navigation={navigation} />);
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('UnifiedPrayerSettings');
    });
  });

  it('logs but does not crash on storage error', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
    const navigation = buildNav();
    const { toJSON } = render(<QiblaScreen navigation={navigation} />);
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
    errSpy.mockRestore();
  });
});
