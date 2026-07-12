import { themes, getThemeVariant, THEME_VARIANT_KEYS } from '../../constants/themes';
import { getItemColors } from '../../constants/Colors';

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

  it('preserves prism itemGradients and itemFg through every variant', () => {
    THEME_VARIANT_KEYS.forEach((variantKey) => {
      const variant = getThemeVariant('prism', variantKey);
      expect(variant.itemGradients).toBe(themes.prism.itemGradients);
      expect(variant.itemFg).toBe(themes.prism.itemFg);
      expect(variant.headerGradient).toBe(themes.prism.headerGradient);
    });
  });

  it('preserves pastel itemGradients and itemFg through every variant', () => {
    THEME_VARIANT_KEYS.forEach((variantKey) => {
      const variant = getThemeVariant('pastel', variantKey);
      expect(variant.itemGradients).toBe(themes.pastel.itemGradients);
      expect(variant.itemFg).toBe(themes.pastel.itemFg);
      expect(variant.headerGradient).toBe(themes.pastel.headerGradient);
    });
  });
});

describe('getItemColors', () => {
  it('returns null for themes without itemGradients', () => {
    expect(getItemColors(themes.goldOnDark, 0)).toBeNull();
  });

  it('cycles the prism palette by position', () => {
    const grads = themes.prism.itemGradients;
    expect(getItemColors(themes.prism, 0).gradient).toBe(grads[0]);
    expect(getItemColors(themes.prism, grads.length).gradient).toBe(grads[0]);
    expect(getItemColors(themes.prism, 3).gradient).toBe(grads[3]);
    expect(getItemColors(themes.prism, 0).fg).toBe('#FFFFFF');
  });
});
