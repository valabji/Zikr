jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `myapp://${path}`),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
}));

jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement('Navigator', null, children),
      Screen: (props) => React.createElement('Screen', props),
    }),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { statusBarHeight: 20 },
}));

jest.mock('../../navigation/DrawerNavigation', () => ({ DNav: () => null }));
jest.mock('../../screens/Screen2', () => () => null);
jest.mock('../../screens/ContributeScreen', () => () => null);
jest.mock('../../screens/UnifiedPrayerSettingsScreen', () => () => null);
jest.mock('../../screens/SettingsScreen', () => () => null);
jest.mock('../../utils/firebase/events', () => ({ __esModule: true, default: jest.fn() }));

import React from 'react';
import { render } from '@testing-library/react-native';
import { AppContainer } from '../../navigation/Main';

describe('navigation/Main', () => {
  it('renders without crashing', () => {
    const tree = render(<AppContainer />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
