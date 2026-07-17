import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from 'jszip';
import {
  THEME_COLOR_KEYS,
  isValidHex,
  validateTheme,
  sanitizeTheme,
  cloneTheme,
  generateThemeId,
  loadCustomThemes,
  persistCustomTheme,
  removeCustomTheme,
  loadHiddenThemes,
  persistHiddenThemes,
  buildThemeZip,
  importThemeFromData,
  CUSTOM_THEMES_KEY,
  HIDDEN_THEMES_KEY,
} from '@/utils/theme/ThemeManager';

const makeTheme = (overrides = {}) => {
  const theme = { name: 'Test Theme', nameAr: 'سمة' };
  THEME_COLOR_KEYS.forEach((key) => { theme[key] = '#112233'; });
  return { ...theme, ...overrides };
};

describe('isValidHex', () => {
  it('accepts 3 and 6 digit hex', () => {
    expect(isValidHex('#abc')).toBe(true);
    expect(isValidHex('#AABB33')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isValidHex('red')).toBe(false);
    expect(isValidHex('#ab')).toBe(false);
    expect(isValidHex('#aabbcg')).toBe(false);
    expect(isValidHex(null)).toBe(false);
  });
});

describe('validateTheme', () => {
  it('passes a complete theme', () => {
    expect(validateTheme(makeTheme())).toBeNull();
  });

  it('rejects non-objects', () => {
    expect(validateTheme(null)).toBe('invalid');
    expect(validateTheme('x')).toBe('invalid');
  });

  it('rejects missing name', () => {
    expect(validateTheme(makeTheme({ name: '  ' }))).toBe('missingName');
  });

  it('names the bad color key', () => {
    expect(validateTheme(makeTheme({ accent: 'blue' }))).toBe('badColor:accent');
  });

  it('rejects malformed gradients', () => {
    expect(validateTheme(makeTheme({ headerGradient: ['nope'] }))).toBe('badGradient');
    expect(validateTheme(makeTheme({ itemGradients: [['#fff', 'bad']] }))).toBe('badGradient');
    expect(validateTheme(makeTheme({ itemFg: 'bad' }))).toBe('badGradient');
  });

  it('accepts valid gradients', () => {
    expect(validateTheme(makeTheme({
      headerGradient: ['#111111', '#222222'],
      itemGradients: [['#333333', '#444444']],
      itemFg: '#555555',
    }))).toBeNull();
  });

  it('validates optional pattern color', () => {
    expect(validateTheme(makeTheme({ patternColor: '#333333', hidePattern: true }))).toBeNull();
    expect(validateTheme(makeTheme({ patternColor: 'bad' }))).toBe('badColor:patternColor');
  });
});

describe('sanitizeTheme', () => {
  it('forces custom flag and font, drops unknown keys', () => {
    const clean = sanitizeTheme(makeTheme({ evil: 'x', fontFamily: 'Comic Sans' }));
    expect(clean.custom).toBe(true);
    expect(clean.fontFamily).toBe('Cairo_400Regular');
    expect(clean.evil).toBeUndefined();
    expect(clean.primary).toBe('#112233');
  });

  it('falls back nameAr to name', () => {
    const clean = sanitizeTheme(makeTheme({ nameAr: '' }));
    expect(clean.nameAr).toBe('Test Theme');
  });

  it('keeps pattern overrides and click sound', () => {
    const clean = sanitizeTheme(makeTheme({ patternColor: '#333333', hidePattern: true, clickSound: '/click.mp3' }));
    expect(clean.patternColor).toBe('#333333');
    expect(clean.hidePattern).toBe(true);
    expect(clean.clickSound).toBe('/click.mp3');
  });
});

describe('cloneTheme', () => {
  it('renames and strips background images', () => {
    const source = makeTheme({ bgImage1: '/some/file.jpg', bgImage2: '/other.png', headerImage: '/h.png', starImage: '/s.png', clickSound: '/c.mp3', patternColor: '#333333' });
    const copy = cloneTheme(source, 'Copy', 'نسخة');
    expect(copy.name).toBe('Copy');
    expect(copy.nameAr).toBe('نسخة');
    expect(copy.bgImage1).toBeUndefined();
    expect(copy.bgImage2).toBeUndefined();
    expect(copy.headerImage).toBeUndefined();
    expect(copy.starImage).toBeUndefined();
    expect(copy.clickSound).toBeUndefined();
    expect(copy.patternColor).toBe('#333333');
    expect(copy.custom).toBe(true);
  });
});

describe('generateThemeId', () => {
  it('produces unique custom_ ids', () => {
    const a = generateThemeId();
    expect(a).toMatch(/^custom_/);
    expect(generateThemeId()).not.toBe(a);
  });
});

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loadCustomThemes returns {} when empty or corrupt', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await loadCustomThemes()).toEqual({});
    AsyncStorage.getItem.mockResolvedValueOnce('not json');
    expect(await loadCustomThemes()).toEqual({});
  });

  it('persistCustomTheme merges into existing map', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ old: { name: 'Old' } }));
    const all = await persistCustomTheme('new', { name: 'New' });
    expect(all).toEqual({ old: { name: 'Old' }, new: { name: 'New' } });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CUSTOM_THEMES_KEY, JSON.stringify(all));
  });

  it('removeCustomTheme deletes entry and asset dir', async () => {
    const FileSystem = require('expo-file-system/legacy');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ gone: {}, kept: {} }));
    const all = await removeCustomTheme('gone');
    expect(all).toEqual({ kept: {} });
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('/mock/document/themes/gone/', { idempotent: true });
  });

  it('hidden themes round-trip and tolerate bad data', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(['a', 'b']));
    expect(await loadHiddenThemes()).toEqual(['a', 'b']);
    AsyncStorage.getItem.mockResolvedValueOnce('{"not":"array"}');
    expect(await loadHiddenThemes()).toEqual([]);
    await persistHiddenThemes(['x']);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(HIDDEN_THEMES_KEY, JSON.stringify(['x']));
  });
});

describe('zip export/import round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('exports a manifest and re-imports the same theme', async () => {
    const theme = sanitizeTheme(makeTheme({ headerGradient: ['#111111', '#222222'] }));
    const zip = await buildThemeZip(theme);
    const manifest = JSON.parse(await zip.file('theme.json').async('string'));
    expect(manifest.format).toBe('zikr-theme');
    expect(manifest.version).toBe(1);

    const base64 = await zip.generateAsync({ type: 'base64' });
    const { id, theme: imported } = await importThemeFromData(base64, { base64: true });
    expect(id).toMatch(/^custom_/);
    expect(imported.name).toBe(theme.name);
    expect(imported.headerGradient).toEqual(theme.headerGradient);
    THEME_COLOR_KEYS.forEach((key) => expect(imported[key]).toBe(theme[key]));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CUSTOM_THEMES_KEY, expect.stringContaining(theme.name));
  });

  it('rejects a zip without theme.json', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'hi');
    const base64 = await zip.generateAsync({ type: 'base64' });
    await expect(importThemeFromData(base64, { base64: true })).rejects.toThrow('notATheme');
  });

  it('rejects a wrong-format manifest', async () => {
    const zip = new JSZip();
    zip.file('theme.json', JSON.stringify({ format: 'other' }));
    const base64 = await zip.generateAsync({ type: 'base64' });
    await expect(importThemeFromData(base64, { base64: true })).rejects.toThrow('notATheme');
  });

  it('rejects an invalid theme inside a valid manifest', async () => {
    const zip = new JSZip();
    zip.file('theme.json', JSON.stringify({ format: 'zikr-theme', version: 1, theme: makeTheme({ primary: 'bad' }) }));
    const base64 = await zip.generateAsync({ type: 'base64' });
    await expect(importThemeFromData(base64, { base64: true })).rejects.toThrow('badColor:primary');
  });

  it('extracts a bundled click sound to the theme dir', async () => {
    const zip = new JSZip();
    zip.file('assets/clickSound.mp3', 'ZmFrZQ==', { base64: true });
    zip.file('theme.json', JSON.stringify({
      format: 'zikr-theme',
      version: 1,
      theme: makeTheme(),
      assets: { clickSound: 'assets/clickSound.mp3' },
    }));
    const base64 = await zip.generateAsync({ type: 'base64' });
    const { theme } = await importThemeFromData(base64, { base64: true });
    expect(theme.clickSound).toMatch(/^\/mock\/document\/themes\/custom_.*clickSound_.*\.mp3$/);
  });

  it('extracts bundled background assets to the theme dir', async () => {
    const FileSystem = require('expo-file-system/legacy');
    const zip = new JSZip();
    zip.file('assets/bgImage1.jpg', 'ZmFrZQ==', { base64: true });
    zip.file('theme.json', JSON.stringify({
      format: 'zikr-theme',
      version: 1,
      theme: makeTheme(),
      assets: { bgImage1: 'assets/bgImage1.jpg' },
    }));
    const base64 = await zip.generateAsync({ type: 'base64' });
    const { theme } = await importThemeFromData(base64, { base64: true });
    expect(theme.bgImage1).toMatch(/^\/mock\/document\/themes\/custom_.*bgImage1_.*\.jpg$/);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
  });
});
