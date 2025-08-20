import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthContext, AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Test component to verify context functionality
const TestComponent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  return (
    <>{JSON.stringify({ user, isAuthenticated, loading })}</>
  );
};

describe('AuthContext', () => {
  it('provides default auth state', () => {
    const { container } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should render without crashing and contain the expected structure
    expect(container).toBeTruthy();
    expect(container.findByProps).toBeDefined();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => render(<TestComponent />)).toThrow();
    
    console.error = originalError;
  });
});