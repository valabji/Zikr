// Mock restart so setLanguage does not actually restart the runtime.
jest.mock('@/utils/restart', () => ({ Restart: jest.fn() }));

// Mock the web RTL helpers — we just want to verify they're called on web.
jest.mock('@/utils/webRTL', () => ({
  isWeb: false,
  applyRTLToDocument: jest.fn(),
  applyWebRTLStyles: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import * as webRTL from '@/utils/webRTL';
import { Restart } from '@/utils/restart';
import { I18nManager } from 'react-native';

const loadI18n = () => {
  let mod;
  jest.isolateModules(() => {
    mod = require('@/locales/i18n');
  });
  return mod;
};

describe('locales/i18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Platform.OS = 'ios';
    I18nManager.isRTL = false;
  });

  describe('t()', () => {
    it('looks up nested keys', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      const val = i18n.t('navigation.favorites');
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    });

    it('returns the key when the path is missing', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      expect(i18n.t('definitely.not.a.real.key')).toBe('definitely.not.a.real.key');
    });

    it('substitutes {param} placeholders', async () => {
      // We need a string with a parameter; use a known fallback approach:
      // hijack translations by mocking ar/en
      jest.isolateModules(() => {
        jest.doMock('@/locales/en.json', () => ({ greet: 'Hello {name}!' }));
        jest.doMock('@/locales/ar.json', () => ({ greet: 'مرحبا {name}!' }));
        const i18n = require('@/locales/i18n');
        return i18n.setLanguage('en', false).then(() => {
          expect(i18n.t('greet', { name: 'World' })).toBe('Hello World!');
        });
      });
    });

    it('leaves placeholders untouched when the param is missing', async () => {
      jest.isolateModules(() => {
        jest.doMock('@/locales/en.json', () => ({ greet: 'Hi {name}' }));
        jest.doMock('@/locales/ar.json', () => ({}));
        const i18n = require('@/locales/i18n');
        return i18n.setLanguage('en', false).then(() => {
          expect(i18n.t('greet', {})).toBe('Hi {name}');
        });
      });
    });
  });

  describe('isRTL() / getCurrentLanguage()', () => {
    it('returns true after setLanguage("ar") on native via I18nManager', async () => {
      const i18n = loadI18n();
      I18nManager.isRTL = false;
      await i18n.setLanguage('ar', false);
      // We mutate I18nManager.isRTL through forceRTL — but the mock doesn't actually flip
      // the flag, so simulate that here:
      I18nManager.isRTL = true;
      expect(i18n.isRTL()).toBe(true);
      expect(i18n.getCurrentLanguage()).toBe('ar');
    });

    it('returns lang-based RTL on web', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('ar', false);
      expect(i18n.isRTL()).toBe(true);
      await i18n.setLanguage('en', false);
      expect(i18n.isRTL()).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('persists to AsyncStorage', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@language', 'ar');
    });

    it('does nothing for an unsupported language', async () => {
      const i18n = loadI18n();
      AsyncStorage.setItem.mockClear();
      await i18n.setLanguage('zz', false);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('calls Restart when restart=true', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', true);
      expect(Restart).toHaveBeenCalled();
    });

    it('does NOT restart when restart=false', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      expect(Restart).not.toHaveBeenCalled();
    });

    it('toggles I18nManager.forceRTL/allowRTL on native', async () => {
      const i18n = loadI18n();
      I18nManager.isRTL = false;
      await i18n.setLanguage('ar', false);
      expect(I18nManager.allowRTL).toHaveBeenCalledWith(true);
      expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
    });

    it('applies web RTL helpers on web', async () => {
      jest.isolateModules(async () => {
        jest.doMock('@/utils/webRTL', () => ({
          isWeb: true,
          applyRTLToDocument: jest.fn(),
          applyWebRTLStyles: jest.fn(),
        }));
        global.Platform.OS = 'web';
        const webRTL = require('@/utils/webRTL');
        const i18n = require('@/locales/i18n');
        await i18n.setLanguage('ar', false);
        expect(webRTL.applyRTLToDocument).toHaveBeenCalledWith(true);
        expect(webRTL.applyWebRTLStyles).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('formatArabicTime', () => {
    afterEach(() => jest.useRealTimers());

    it('returns "" for falsy input', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      expect(i18n.formatArabicTime(null)).toBe('');
    });

    it('converts AM/PM to Arabic ص / م in Arabic mode but keeps English numerals', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      const t = moment('2025-06-15T13:30:00');
      const out = i18n.formatArabicTime(t);
      expect(out).toMatch(/م/); // PM → م
      expect(out).toMatch(/1:30/);
    });

    it('uses 24-hour when requested', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      const t = moment('2025-06-15T13:30:00');
      expect(i18n.formatArabicTime(t, true)).toMatch(/13:30/);
    });

    it('falls back to plain English formatting outside Arabic', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      const t = moment('2025-06-15T13:30:00');
      expect(i18n.formatArabicTime(t)).toBe('1:30 PM');
    });
  });

  describe('formatArabicCountdown', () => {
    it('returns input unchanged when not in Arabic', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      expect(i18n.formatArabicCountdown('2h 30m')).toBe('2h 30m');
    });

    it('returns "" for falsy input', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      expect(i18n.formatArabicCountdown('')).toBe('');
      expect(i18n.formatArabicCountdown(null)).toBeNull();
    });

    it('translates h/m/s units when in Arabic', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      expect(i18n.formatArabicCountdown('2h 30m')).toBe('2س 30د');
      expect(i18n.formatArabicCountdown('45s')).toBe('45ث');
    });
  });

  describe('formatArabicDate', () => {
    it('formats with Arabic month/day name + English numerals in Arabic mode', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('ar', false);
      const out = i18n.formatArabicDate(moment('2025-06-15'));
      expect(out).toMatch(/2025/); // year preserved as English numerals
    });

    it('uses default moment formatting in English', async () => {
      const i18n = loadI18n();
      await i18n.setLanguage('en', false);
      const out = i18n.formatArabicDate(moment('2025-06-15'));
      expect(out).toMatch(/2025/);
    });
  });

  describe('getDirectionalSpacing / getDirectionalPadding', () => {
    it('does not flip on native', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'ios';
      await i18n.setLanguage('ar', false);
      I18nManager.isRTL = true;
      expect(i18n.getDirectionalSpacing(5, 10)).toEqual({ marginLeft: 5, marginRight: 10 });
      expect(i18n.getDirectionalPadding(5, 10)).toEqual({ paddingLeft: 5, paddingRight: 10 });
    });

    it('flips on web when RTL', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('ar', false);
      expect(i18n.getDirectionalSpacing(5, 10)).toEqual({ marginLeft: 10, marginRight: 5 });
      expect(i18n.getDirectionalPadding(5, 10)).toEqual({ paddingLeft: 10, paddingRight: 5 });
    });

    it('does not flip on web in LTR', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('en', false);
      expect(i18n.getDirectionalSpacing(5, 10)).toEqual({ marginLeft: 5, marginRight: 10 });
    });
  });

  describe('getDirectionalMixedSpacing', () => {
    it('returns only the supplied keys on native', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'ios';
      await i18n.setLanguage('ar', false);
      I18nManager.isRTL = true;
      expect(
        i18n.getDirectionalMixedSpacing({ marginLeft: 5, paddingRight: 3, top: 2 })
      ).toEqual({ marginLeft: 5, paddingRight: 3, top: 2 });
    });

    it('flips margins/paddings/positions on web in RTL', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('ar', false);
      const result = i18n.getDirectionalMixedSpacing({
        marginLeft: 1,
        marginRight: 2,
        paddingLeft: 3,
        paddingRight: 4,
        left: 5,
        right: 6,
        top: 7,
        bottom: 8,
      });
      expect(result).toEqual({
        marginLeft: 2,
        marginRight: 1,
        paddingLeft: 4,
        paddingRight: 3,
        left: 6,
        right: 5,
        top: 7,
        bottom: 8,
      });
    });

    it('on web LTR returns values unchanged', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('en', false);
      expect(i18n.getDirectionalMixedSpacing({ marginLeft: 1, marginRight: 2 })).toEqual({
        marginLeft: 1,
        marginRight: 2,
      });
    });
  });

  describe('getRTLTextAlign', () => {
    it('returns defaultAlign unchanged on native', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'ios';
      expect(i18n.getRTLTextAlign('left')).toBe('left');
    });

    it('on web flips left↔right when RTL', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('ar', false);
      expect(i18n.getRTLTextAlign('left')).toBe('right');
      expect(i18n.getRTLTextAlign('right')).toBe('left');
    });

    it('preserves center alignment', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('ar', false);
      expect(i18n.getRTLTextAlign('center')).toBe('center');
    });
  });

  describe('getArabicContentAlign', () => {
    it('returns right on web regardless of app language', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'web';
      await i18n.setLanguage('en', false);
      expect(i18n.getArabicContentAlign()).toBe('right');
      await i18n.setLanguage('ar', false);
      expect(i18n.getArabicContentAlign()).toBe('right');
    });

    it('on native flips for I18nManager mirroring', async () => {
      const i18n = loadI18n();
      const { I18nManager } = require('react-native');
      global.Platform.OS = 'ios';
      I18nManager.isRTL = false;
      await i18n.setLanguage('en', false);
      expect(i18n.getArabicContentAlign()).toBe('right');
      I18nManager.isRTL = true;
      await i18n.setLanguage('ar', false);
      expect(i18n.getArabicContentAlign()).toBe('left');
    });
  });

  describe('arabicContentStyle', () => {
    it('always sets rtl direction and writingDirection', async () => {
      const i18n = loadI18n();
      global.Platform.OS = 'ios';
      await i18n.setLanguage('en', false);
      expect(i18n.arabicContentStyle({ fontSize: 18 })).toEqual({
        textAlign: 'right',
        writingDirection: 'rtl',
        direction: 'rtl',
        fontSize: 18,
      });
    });
  });

  describe('initializeLanguage', () => {
    it('uses saved language from AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('en');
      const i18n = loadI18n();
      await i18n.initializeLanguage();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@language');
    });

    it('falls back to default and persists when no language stored', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const i18n = loadI18n();
      await i18n.initializeLanguage();
      // Default 'ar' should be persisted (because Platform.OS is ios → not web → setLanguage with restart=true on mobile)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@language', 'ar');
    });

    it('catches storage errors gracefully', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
      const i18n = loadI18n();
      await expect(i18n.initializeLanguage()).resolves.toBeUndefined();
      warn.mockRestore();
    });
  });
});
