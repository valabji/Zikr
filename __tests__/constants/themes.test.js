import { themes, getThemeVariant, THEME_VARIANT_KEYS } from '../../constants/themes';

describe('getThemeVariant', () => {
  it('returns the unmodified base theme when no variant is given', () => {
    expect(getThemeVariant('goldOnDark', null)).toEqual(themes.goldOnDark);
    expect(getThemeVariant('goldOnDark', undefined)).toEqual(themes.goldOnDark);
  });

  it('falls back to goldOnDark for an unknown theme key', () => {
    expect(getThemeVariant('doesNotExist', null)).toEqual(themes.goldOnDark);
  });

  it('falls back to the base theme for an unknown variant key', () => {
    expect(getThemeVariant('goldOnDark', 'midnight')).toEqual(themes.goldOnDark);
  });

  it.each(THEME_VARIANT_KEYS)('produces a distinct, valid palette for the %s variant', (variantKey) => {
    const base = themes.goldOnDark;
    const variant = getThemeVariant('goldOnDark', variantKey);

    expect(variant.background).not.toBe(base.background);
    expect(variant.surface).not.toBe(base.surface);
    [
      'background',
      'surface',
      'primary',
      'primaryMedium',
      'primaryDark',
      'accent',
      'accentDark',
    ].forEach((field) => {
      expect(variant[field]).toMatch(/^#[0-9a-f]{6}$/i);
    });
    // Non-color metadata is preserved unchanged
    expect(variant.name).toBe(base.name);
    expect(variant.fontFamily).toBe(base.fontFamily);
  });

  it('applies variants consistently across every theme', () => {
    Object.keys(themes).forEach((themeKey) => {
      THEME_VARIANT_KEYS.forEach((variantKey) => {
        const variant = getThemeVariant(themeKey, variantKey);
        expect(variant.background).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
