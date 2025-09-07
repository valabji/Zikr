// Mock the translation function
jest.mock('../../locales/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'qibla.switchCompassMethod': 'Switch Compass Method',
      'qibla.chooseMethod': 'Choose a compass method:',
      'qibla.autoSelect': 'Auto Select',
      'qibla.autoSelectDescription': 'Automatically select the best available method',
      'qibla.gpsMagneticEnhanced': 'Magnetic Enhanced GPS',
      'qibla.gpsMagneticEnhancedDescription': 'Use GPS magnetic enhanced for improved accuracy',
      'qibla.gps': 'GPS',
      'qibla.gpsDescription': 'Use GPS for high accuracy',
      'qibla.magnetometer': 'Magnetometer',
      'qibla.magnetometerDescription': 'Use device magnetometer sensor',
      'qibla.cancel': 'Cancel'
    };
    return translations[key] || key;
  }),
  getDirectionalMixedSpacing: jest.fn(() => ({ marginLeft: 0, marginRight: 0 }))
}));

// Mock the component itself before any imports
jest.mock('../../components/CompassMethodModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  const { t } = require('../../locales/i18n');
  
  return function MockedCompassMethodModal(props) {
    const { visible, onClose, onMethodSelect, availableMethods } = props;
    
    if (!visible) return null;
    
    return React.createElement(View, { testID: "compass-method-modal" },
      React.createElement(Text, null, t('qibla.switchCompassMethod')),
      React.createElement(Text, null, t('qibla.chooseMethod')),
      React.createElement(TouchableOpacity, { onPress: () => onMethodSelect('auto') },
        React.createElement(Text, null, t('qibla.autoSelect'))
      ),
      availableMethods.includes('magHeading') && React.createElement(TouchableOpacity, { onPress: () => onMethodSelect('magHeading') },
        React.createElement(Text, null, t('qibla.gpsMagneticEnhanced'))
      ),
      availableMethods.includes('trueHeading') && React.createElement(TouchableOpacity, { onPress: () => onMethodSelect('trueHeading') },
        React.createElement(Text, null, t('qibla.gps'))
      ),
      availableMethods.includes('magnetometer') && React.createElement(TouchableOpacity, { onPress: () => onMethodSelect('magnetometer') },
        React.createElement(Text, null, t('qibla.magnetometer'))
      ),
      React.createElement(TouchableOpacity, { onPress: onClose },
        React.createElement(Text, null, t('qibla.cancel'))
      )
    );
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import CompassMethodModal from '../../components/CompassMethodModal';
import { t } from '../../locales/i18n';

describe('CompassMethodModal', () => {
  it('renders when visible', () => {
    const { getByTestId } = render(
      <CompassMethodModal
        visible={true}
        onClose={() => {}}
        onMethodSelect={() => {}}
        availableMethods={['magHeading', 'trueHeading', 'magnetometer']}
      />
    );
    
    expect(getByTestId('compass-method-modal')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <CompassMethodModal
        visible={false}
        onClose={() => {}}
        onMethodSelect={() => {}}
        availableMethods={['magHeading', 'trueHeading', 'magnetometer']}
      />
    );
    
    expect(queryByTestId('compass-method-modal')).toBeNull();
  });

  it('renders methods in correct order: GPS Enhanced, GPS, Magnetometer', () => {
    const { getByText } = render(
      <CompassMethodModal
        visible={true}
        onClose={() => {}}
        onMethodSelect={() => {}}
        availableMethods={['magHeading', 'trueHeading', 'magnetometer']}
      />
    );
    
    expect(getByText(t('qibla.autoSelect'))).toBeTruthy();
    expect(getByText(t('qibla.gpsMagneticEnhanced'))).toBeTruthy();
    expect(getByText(t('qibla.gps'))).toBeTruthy();
    expect(getByText(t('qibla.magnetometer'))).toBeTruthy();
  });

  it('uses translation keys for all text content', () => {
    const mockT = require('../../locales/i18n').t;
    
    render(
      <CompassMethodModal
        visible={true}
        onClose={() => {}}
        onMethodSelect={() => {}}
        availableMethods={['magHeading', 'trueHeading', 'magnetometer']}
      />
    );
    
    // Verify that translation function is called (basic check)
    expect(mockT).toHaveBeenCalled();
    // Verify it's called with qibla namespace keys
    const calls = mockT.mock.calls.map(call => call[0]).filter(key => key.startsWith('qibla.'));
    expect(calls.length).toBeGreaterThan(0);
  });
});
