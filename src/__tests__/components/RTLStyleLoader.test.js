import React from 'react';
import { render } from '@testing-library/react-native';
import RTLStyleLoader from '@/components/RTLStyleLoader';

describe('RTLStyleLoader', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = global.document;
  });

  afterEach(() => {
    global.document = originalDocument;
    global.Platform.OS = 'ios';
  });

  it('renders null', () => {
    const { toJSON } = render(<RTLStyleLoader />);
    expect(toJSON()).toBeNull();
  });

  it('is a no-op on native', () => {
    global.Platform.OS = 'ios';
    const append = jest.fn();
    global.document = { getElementById: jest.fn(), head: { appendChild: append } };
    render(<RTLStyleLoader />);
    expect(append).not.toHaveBeenCalled();
  });

  it('on web, injects the RTL stylesheet when not already present', () => {
    global.Platform.OS = 'web';
    const append = jest.fn();
    global.document = {
      getElementById: jest.fn(() => null),
      createElement: jest.fn(() => ({})),
      head: { appendChild: append },
    };
    render(<RTLStyleLoader />);
    expect(append).toHaveBeenCalled();
  });

  it('on web, does NOT re-inject if the stylesheet is already present', () => {
    global.Platform.OS = 'web';
    const append = jest.fn();
    global.document = {
      getElementById: jest.fn(() => ({ id: 'rtl-styles' })),
      createElement: jest.fn(),
      head: { appendChild: append },
    };
    render(<RTLStyleLoader />);
    expect(append).not.toHaveBeenCalled();
  });
});
