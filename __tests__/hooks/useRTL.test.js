// Mock i18n so we can control isRTL() / getCurrentLanguage() per test
jest.mock('../../locales/i18n', () => ({
  isRTL: jest.fn(() => false),
  getCurrentLanguage: jest.fn(() => 'en'),
}));

import { renderHook, act } from '@testing-library/react-native';
import * as i18n from '../../locales/i18n';
import { useRTL } from '../../hooks/useRTL';

const mockIsRTL = i18n.isRTL;
const mockGetCurrentLanguage = i18n.getCurrentLanguage;

describe('useRTL hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.Platform.OS = 'ios';
    mockIsRTL.mockReturnValue(false);
    mockGetCurrentLanguage.mockReturnValue('en');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial isRTL=false / currentLanguage="en"', () => {
    const { result } = renderHook(() => useRTL());
    expect(result.current.isRTL).toBe(false);
    expect(result.current.currentLanguage).toBe('en');
  });

  it('reflects updates from the i18n module via its polling interval', () => {
    const { result } = renderHook(() => useRTL());
    expect(result.current.isRTL).toBe(false);
    mockIsRTL.mockReturnValue(true);
    mockGetCurrentLanguage.mockReturnValue('ar');
    act(() => {
      jest.advanceTimersByTime(150); // > 100ms interval
    });
    expect(result.current.isRTL).toBe(true);
    expect(result.current.currentLanguage).toBe('ar');
  });

  it('clears the polling interval on unmount (no more updates fire)', () => {
    const { result, unmount } = renderHook(() => useRTL());
    unmount();
    mockIsRTL.mockReturnValue(true);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // After unmount the interval is cleared, so the result snapshot should still be from
    // before unmount (no error thrown means the cleanup ran cleanly)
    expect(result.current.isRTL).toBe(false);
  });

  describe('getRTLStyle', () => {
    it('returns ltrStyle in LTR mode', () => {
      const { result } = renderHook(() => useRTL());
      expect(result.current.getRTLStyle({ color: 'red' }, { color: 'blue' })).toEqual({
        color: 'red',
      });
    });

    it('returns rtlStyle in RTL mode', () => {
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getRTLStyle({ color: 'red' }, { color: 'blue' })).toEqual({
        color: 'blue',
      });
    });
  });

  describe('getTextAlign', () => {
    it('does not flip on native in RTL (textAlign is logical there)', () => {
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getTextAlign('left')).toBe('left');
      expect(result.current.getTextAlign('right')).toBe('right');
    });

    it('flips left/right on web in RTL', () => {
      global.Platform.OS = 'web';
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getTextAlign('left')).toBe('right');
      expect(result.current.getTextAlign('right')).toBe('left');
    });

    it('keeps alignment on web in LTR', () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useRTL());
      expect(result.current.getTextAlign('left')).toBe('left');
      expect(result.current.getTextAlign('right')).toBe('right');
    });

    it('preserves arbitrary defaultAlign values', () => {
      global.Platform.OS = 'web';
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getTextAlign('center')).toBe('center');
    });
  });

  describe('directional spacing helpers', () => {
    it('on native, returns spacing as given regardless of RTL', () => {
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getDirectionalSpacing(5, 10)).toEqual({
        marginLeft: 5,
        marginRight: 10,
      });
      expect(result.current.getDirectionalPadding(5, 10)).toEqual({
        paddingLeft: 5,
        paddingRight: 10,
      });
    });

    it('on web RTL, flips margins and paddings', () => {
      global.Platform.OS = 'web';
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(result.current.getDirectionalSpacing(5, 10)).toEqual({
        marginRight: 5,
        marginLeft: 10,
      });
      expect(result.current.getDirectionalPadding(5, 10)).toEqual({
        paddingRight: 5,
        paddingLeft: 10,
      });
    });

    it('on web LTR, keeps margins and paddings', () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useRTL());
      expect(result.current.getDirectionalSpacing(5, 10)).toEqual({
        marginLeft: 5,
        marginRight: 10,
      });
    });
  });

  describe('getDirectionalMixedSpacing', () => {
    it('on native returns supplied keys only', () => {
      const { result } = renderHook(() => useRTL());
      expect(
        result.current.getDirectionalMixedSpacing({ marginLeft: 1, paddingRight: 3 })
      ).toEqual({ marginLeft: 1, paddingRight: 3 });
    });

    it('on web RTL flips margins and paddings', () => {
      global.Platform.OS = 'web';
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useRTL());
      expect(
        result.current.getDirectionalMixedSpacing({
          marginLeft: 1,
          marginRight: 2,
          paddingLeft: 3,
          paddingRight: 4,
        })
      ).toEqual({ marginLeft: 2, marginRight: 1, paddingLeft: 4, paddingRight: 3 });
    });

    it('on web LTR returns values unchanged', () => {
      global.Platform.OS = 'web';
      const { result } = renderHook(() => useRTL());
      expect(
        result.current.getDirectionalMixedSpacing({ marginLeft: 1, marginRight: 2 })
      ).toEqual({ marginLeft: 1, marginRight: 2 });
    });
  });

});
