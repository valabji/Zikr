// We import webRTL once per "platform"; need fresh module per Platform.OS swap because
// `isWeb` is evaluated at module-load time.
const loadWebRTL = (os = 'web') => {
  let mod;
  jest.isolateModules(() => {
    global.Platform.OS = os;
    mod = require('../webRTL');
  });
  return mod;
};

describe('webRTL', () => {
  let originalDocument;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDocument = global.document;
  });

  afterEach(() => {
    global.document = originalDocument;
    global.Platform.OS = 'ios';
  });

  describe('isWeb', () => {
    it('is true when Platform.OS is web', () => {
      const mod = loadWebRTL('web');
      expect(mod.isWeb).toBe(true);
    });

    it('is false on native', () => {
      const mod = loadWebRTL('ios');
      expect(mod.isWeb).toBe(false);
    });
  });

  describe('applyRTLToDocument', () => {
    const makeDocStubs = () => {
      const html = {
        setAttribute: jest.fn(),
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() },
      };
      const body = { style: {} };
      return { documentElement: html, body };
    };

    it('sets rtl attributes/classes when RTL', () => {
      global.document = makeDocStubs();
      const mod = loadWebRTL('web');
      // Re-stub document after isolateModules (which captures the module under a fresh registry)
      global.document = makeDocStubs();
      mod.applyRTLToDocument(true);
      expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
      expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('lang', 'ar');
      expect(global.document.documentElement.classList.add).toHaveBeenCalledWith('rtl');
      expect(global.document.documentElement.classList.remove).toHaveBeenCalledWith('ltr');
    });

    it('sets ltr attributes/classes when not RTL', () => {
      global.document = makeDocStubs();
      const mod = loadWebRTL('web');
      global.document = makeDocStubs();
      mod.applyRTLToDocument(false);
      expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'ltr');
      expect(global.document.documentElement.classList.add).toHaveBeenCalledWith('ltr');
    });

    it('is a no-op on native', () => {
      const mod = loadWebRTL('ios');
      // Should not throw even if document is undefined
      delete global.document;
      expect(() => mod.applyRTLToDocument(true)).not.toThrow();
    });
  });

  describe('getRTLClassName', () => {
    it('returns rtl/ltr based on flag', () => {
      const mod = loadWebRTL('web');
      expect(mod.getRTLClassName(true)).toBe('rtl');
      expect(mod.getRTLClassName(false)).toBe('ltr');
    });

    it('prefixes with base class', () => {
      const mod = loadWebRTL('web');
      expect(mod.getRTLClassName(true, 'btn')).toBe('btn rtl');
    });
  });

  describe('createRTLStyle', () => {
    it('returns ltrStyles when not RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.createRTLStyle(false, { color: 'red' }, { color: 'blue' })).toEqual({
        color: 'red',
      });
    });

    it('merges rtlStyles over ltrStyles when RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.createRTLStyle(true, { color: 'red', fontSize: 10 }, { color: 'blue' })).toEqual({
        color: 'blue',
        fontSize: 10,
      });
    });
  });

  describe('flipSpacing', () => {
    it('flips both margins when both present (web + RTL)', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipSpacing(true, { marginLeft: 5, marginRight: 10 })).toEqual({
        marginLeft: 10,
        marginRight: 5,
      });
    });

    it('moves marginLeft → marginRight when only one present', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipSpacing(true, { marginLeft: 5 })).toEqual({ marginRight: 5 });
      expect(mod.flipSpacing(true, { marginRight: 5 })).toEqual({ marginLeft: 5 });
    });

    it('also flips paddings', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipSpacing(true, { paddingLeft: 1, paddingRight: 2 })).toEqual({
        paddingLeft: 2,
        paddingRight: 1,
      });
      expect(mod.flipSpacing(true, { paddingLeft: 5 })).toEqual({ paddingRight: 5 });
      expect(mod.flipSpacing(true, { paddingRight: 5 })).toEqual({ paddingLeft: 5 });
    });

    it('returns spacing unchanged on native', () => {
      const mod = loadWebRTL('ios');
      const spacing = { marginLeft: 5 };
      expect(mod.flipSpacing(true, spacing)).toBe(spacing);
    });

    it('returns spacing unchanged when not RTL', () => {
      const mod = loadWebRTL('web');
      const spacing = { marginLeft: 5 };
      expect(mod.flipSpacing(false, spacing)).toBe(spacing);
    });

    it('returns falsy spacing unchanged', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipSpacing(true, null)).toBeNull();
    });
  });

  describe('flipPosition', () => {
    it('swaps left/right when both present', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipPosition(true, { left: 5, right: 10 })).toEqual({ left: 10, right: 5 });
    });

    it('moves left → right when only one present', () => {
      const mod = loadWebRTL('web');
      expect(mod.flipPosition(true, { left: 5 })).toEqual({ right: 5 });
      expect(mod.flipPosition(true, { right: 7 })).toEqual({ left: 7 });
    });

    it('returns unchanged on native or not RTL', () => {
      const mod = loadWebRTL('ios');
      const position = { left: 5 };
      expect(mod.flipPosition(true, position)).toBe(position);
      const mod2 = loadWebRTL('web');
      expect(mod2.flipPosition(false, position)).toBe(position);
    });
  });

  describe('getTextAlignment', () => {
    it('preserves center', () => {
      const mod = loadWebRTL('web');
      expect(mod.getTextAlignment(true, 'center')).toBe('center');
    });

    it('flips left→right and right→left when RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.getTextAlignment(true, 'left')).toBe('right');
      expect(mod.getTextAlignment(true, 'right')).toBe('left');
    });

    it('keeps alignment when not RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.getTextAlignment(false, 'left')).toBe('left');
    });
  });

  describe('getRTLTextAlign', () => {
    it('returns "auto" on native', () => {
      const mod = loadWebRTL('ios');
      expect(mod.getRTLTextAlign('left')).toBe('auto');
    });

    it('uses i18n.isRTL on web', () => {
      jest.isolateModules(() => {
        global.Platform.OS = 'web';
        jest.doMock('../../locales/i18n', () => ({ isRTL: () => true }));
        const mod = require('../webRTL');
        expect(mod.getRTLTextAlign('left')).toBe('right');
      });
    });

    it('falls back to default alignment when i18n is unavailable', () => {
      jest.isolateModules(() => {
        global.Platform.OS = 'web';
        jest.doMock('../../locales/i18n', () => {
          throw new Error('not loaded');
        });
        const mod = require('../webRTL');
        expect(mod.getRTLTextAlign('left')).toBe('left');
      });
    });
  });

  describe('getFlexDirection', () => {
    it('returns row-reverse when RTL on a row layout', () => {
      const mod = loadWebRTL('web');
      expect(mod.getFlexDirection(true, 'row')).toBe('row-reverse');
    });

    it('returns row when not RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.getFlexDirection(false, 'row')).toBe('row');
    });

    it('preserves column direction even when RTL', () => {
      const mod = loadWebRTL('web');
      expect(mod.getFlexDirection(true, 'column')).toBe('column');
    });
  });

  describe('applyWebRTLStyles', () => {
    it('is a no-op on native', () => {
      const mod = loadWebRTL('ios');
      expect(() => mod.applyWebRTLStyles(true)).not.toThrow();
    });

    it('sets body class and updates inputs on web', () => {
      const body = { className: 'foo ltr' };
      const input = { style: {} };
      global.document = {
        body,
        querySelectorAll: jest.fn(() => [input]),
      };
      const mod = loadWebRTL('web');
      // Stub document again after isolateModules
      global.document = {
        body,
        querySelectorAll: jest.fn(() => [input]),
      };
      mod.applyWebRTLStyles(true);
      expect(body.className).toContain('rtl');
      expect(body.className).not.toContain('ltr');
      expect(input.style.direction).toBe('rtl');
      expect(input.style.textAlign).toBe('right');
    });
  });
});
