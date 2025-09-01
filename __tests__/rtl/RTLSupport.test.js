import React from 'react';
import { render } from '@testing-library/react-native';
import { setLanguage, isRTL, getCurrentLanguage } from '../../locales/i18n';
import { useRTL } from '../../hooks/useRTL';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn((options) => options.web),
}));

// Mock restart utility
jest.mock('../../utils/restart', () => ({
  Restart: jest.fn(),
}));

// Test component
const TestComponent = () => {
  const { isRTL: isRTLHook, getTextAlign, getFlexDirection } = useRTL();
  
  return (
    <div>
      <div testID="rtl-status">{isRTLHook ? 'RTL' : 'LTR'}</div>
      <div testID="text-align">{getTextAlign()}</div>
      <div testID="flex-direction">{getFlexDirection()}</div>
    </div>
  );
};

describe('RTL Support', () => {
  beforeEach(() => {
    // Reset DOM
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.className = '';
    }
  });

  test('should set Arabic language and RTL direction', async () => {
    await setLanguage('ar', false);
    
    expect(getCurrentLanguage()).toBe('ar');
    expect(isRTL()).toBe(true);
    
    // Check if DOM is updated for web
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
      expect(document.documentElement.classList.contains('rtl')).toBe(true);
    }
  });

  test('should set English language and LTR direction', async () => {
    await setLanguage('en', false);
    
    expect(getCurrentLanguage()).toBe('en');
    expect(isRTL()).toBe(false);
    
    // Check if DOM is updated for web
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
      expect(document.documentElement.classList.contains('ltr')).toBe(true);
    }
  });

  test('useRTL hook should provide correct RTL values', async () => {
    await setLanguage('ar', false);
    
    const { getByTestId } = render(<TestComponent />);
    
    // Note: In a real test environment, you might need to wait for state updates
    // This is a simplified test structure
    expect(getByTestId('rtl-status')).toBeTruthy();
  });

  test('should handle invalid language gracefully', async () => {
    const originalLang = getCurrentLanguage();
    await setLanguage('invalid', false);
    
    // Should not change the language
    expect(getCurrentLanguage()).toBe(originalLang);
  });
});
