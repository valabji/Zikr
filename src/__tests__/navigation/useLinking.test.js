jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `myapp://${path}`),
}));

import * as Linking from 'expo-linking';
import linkingOptions from '@/navigation/useLinking';

describe('navigation/useLinking', () => {
  it('uses Linking.createURL("/") for the deep-link prefix', () => {
    expect(Linking.createURL).toHaveBeenCalledWith('/');
    expect(linkingOptions.prefixes).toEqual(['myapp:///']);
  });

  it('declares routes for Home / Links / Settings under "root"', () => {
    expect(linkingOptions.config).toEqual({
      path: 'root',
      screens: {
        Home: 'home',
        Links: 'links',
        Settings: 'settings',
      },
    });
  });
});
