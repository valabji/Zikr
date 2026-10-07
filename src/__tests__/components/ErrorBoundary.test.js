import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

jest.mock('@/utils/restart', () => ({ Restart: jest.fn() }));
const { Restart } = require('@/utils/restart');

function Bomb() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    jest.clearAllMocks();
  });

  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>content</Text>
      </ErrorBoundary>
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('renders fallback with error message when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(getByText('boom')).toBeTruthy();
  });

  it('calls onError with the thrown error', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.anything());
  });

  it('restart button resets state and calls Restart', () => {
    const { UNSAFE_root } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const button = UNSAFE_root.findByType(require('react-native').TouchableOpacity);
    fireEvent.press(button);
    expect(Restart).toHaveBeenCalled();
  });
});
