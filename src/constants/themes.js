// Single source of truth for all theme definitions
import { FONT_FAMILY } from './Fonts';
import { lighten, darken, mix } from '@/utils/colorShift';
import { THEME_VARIANT_KEYS } from '@/utils/ThemeVariant';

export { THEME_VARIANT_KEYS };

export const themes = {
  originalGreen: {
    name: 'Original Green',
    nameAr: 'الأخضر الأصلي',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#003C34',
    primaryMedium: '#002B25',
    primaryDark: '#002520',
    accent: '#FFE29D',
    accentDark: '#D1955E',
    background: '#003C34',
    surface: '#002B25',
    text: '#FFE29D',
    textSecondary: '#D1955E',
    // Prayer time colors
    currentPrayer: '#4CAF50',
    nextPrayer: '#FF9800',
    pastPrayer: '#7E7E7E',
    // Notice and warning colors
    noticeBackground: '#1B4D3E',
    noticeText: '#FFE29D',
    noticeAccent: '#4CAF50',
    warningBackground: '#3D2914',
    warningText: '#FFE29D',
    warningAccent: '#FF9800',
  },
  goldOnWhite: {
    name: 'Gold on White',
    nameAr: 'الذهبي على الأبيض',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#FFFFFF',
    primaryMedium: '#F5F5F5',
    primaryDark: '#E0E0E0',
    accent: '#D1955E',
    accentDark: '#B8804A',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#D1955E',
    textSecondary: '#B8804A',
    // Prayer time colors
    currentPrayer: '#4CAF50',
    nextPrayer: '#FF9800',
    pastPrayer: '#9E9E9E',
    // Notice and warning colors
    noticeBackground: '#E3F2FD',
    noticeText: '#1976D2',
    noticeAccent: '#2196F3',
    warningBackground: '#FFF3E0',
    warningText: '#E65100',
    warningAccent: '#FF9800',
  },
  goldOnDark: {
    name: 'Gold on Dark',
    nameAr: 'الذهبي على الأسود',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#1A1A1A',
    primaryMedium: '#2A2A2A',
    primaryDark: '#0A0A0A',
    accent: '#FFE29D',
    accentDark: '#D1955E',
    background: '#1A1A1A',
    surface: '#2A2A2A',
    text: '#FFE29D',
    textSecondary: '#D1955E',
    // Prayer time colors
    currentPrayer: '#66BB6A',
    nextPrayer: '#FFB74D',
    pastPrayer: '#757575',
    // Notice and warning colors
    noticeBackground: '#1A2E3A',
    noticeText: '#FFE29D',
    noticeAccent: '#42A5F5',
    warningBackground: '#3A2A1A',
    warningText: '#FFE29D',
    warningAccent: '#FFB74D',
  },
  paige: {
    name: 'Paige',
    nameAr: 'بيج',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#F5F5DC',
    primaryMedium: '#E6E6D1',
    primaryDark: '#D4D4B8',
    accent: '#8B4513',
    accentDark: '#654321',
    background: '#F5F5DC',
    surface: '#E6E6D1',
    text: '#8B4513',
    textSecondary: '#654321',
    // Prayer time colors
    currentPrayer: '#4CAF50',
    nextPrayer: '#FF8C00',
    pastPrayer: '#8D6E63',
    // Notice and warning colors
    noticeBackground: '#E8F5E8',
    noticeText: '#2E7D32',
    noticeAccent: '#4CAF50',
    warningBackground: '#FFF8E1',
    warningText: '#E65100',
    warningAccent: '#FF8C00',
  },
  chocolate: {
    name: 'Chocolate',
    nameAr: 'شوكولاتة',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#8D6E63',
    primaryMedium: '#A1887F',
    primaryDark: '#5D4037',
    accent: '#FFF8E1',
    accentDark: '#F5E6A3',
    background: '#8D6E63',
    surface: '#A1887F',
    text: '#FFF8E1',
    textSecondary: '#F5E6A3',
    // Prayer time colors
    currentPrayer: '#66BB6A',
    nextPrayer: '#FFB74D',
    pastPrayer: '#795548',
    // Notice and warning colors
    noticeBackground: '#6D4C41',
    noticeText: '#FFF8E1',
    noticeAccent: '#81C784',
    warningBackground: '#5D4037',
    warningText: '#FFF8E1',
    warningAccent: '#FFB74D',
  },
  lavender: {
    name: 'Lavender',
    nameAr: 'لافندر',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#B39DDB',
    primaryMedium: '#C5B4E3',
    primaryDark: '#9575CD',
    accent: '#FFF9E6',
    accentDark: '#F0E6D2',
    background: '#B39DDB',
    surface: '#C5B4E3',
    text: '#FFF9E6',
    textSecondary: '#F0E6D2',
    // Prayer time colors
    currentPrayer: '#66BB6A',
    nextPrayer: '#FFB74D',
    pastPrayer: '#9E9E9E',
    // Notice and warning colors
    noticeBackground: '#7E57C2',
    noticeText: '#FFF9E6',
    noticeAccent: '#81C784',
    warningBackground: '#6A1B9A',
    warningText: '#FFF9E6',
    warningAccent: '#FFB74D',
  },
  sky: {
    name: 'Sky Blue',
    nameAr: 'الأزرق السماوي',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#E8F4FD',
    primaryMedium: '#D4EAFB',
    primaryDark: '#BBDDF6',
    accent: '#1565C0',
    accentDark: '#0D47A1',
    background: '#E8F4FD',
    surface: '#D4EAFB',
    text: '#1565C0',
    textSecondary: '#0D47A1',
    // Prayer time colors
    currentPrayer: '#4CAF50',
    nextPrayer: '#FB8C00',
    pastPrayer: '#90A4AE',
    // Notice and warning colors
    noticeBackground: '#D6EAF8',
    noticeText: '#0D47A1',
    noticeAccent: '#2196F3',
    warningBackground: '#FFF3E0',
    warningText: '#E65100',
    warningAccent: '#FB8C00',
  },
  navy: {
    name: 'Navy Blue',
    nameAr: 'الأزرق البحري',
    // Font configuration
    fontFamily: FONT_FAMILY,
    primary: '#0A1931',
    primaryMedium: '#102444',
    primaryDark: '#06101F',
    accent: '#A7C7E7',
    accentDark: '#6E97C4',
    background: '#0A1931',
    surface: '#102444',
    text: '#A7C7E7',
    textSecondary: '#6E97C4',
    // Prayer time colors
    currentPrayer: '#66BB6A',
    nextPrayer: '#FFB74D',
    pastPrayer: '#5C6F88',
    // Notice and warning colors
    noticeBackground: '#12325C',
    noticeText: '#A7C7E7',
    noticeAccent: '#42A5F5',
    warningBackground: '#33291A',
    warningText: '#A7C7E7',
    warningAccent: '#FFB74D',
  },
  prism: {
    name: 'Prism',
    nameAr: 'الطيف',
    fontFamily: FONT_FAMILY,
    primary: '#0F1220',
    primaryMedium: '#1A1F35',
    primaryDark: '#0A0D18',
    accent: '#C7D2FE',
    accentDark: '#818CF8',
    background: '#0F1220',
    surface: '#1A1F35',
    text: '#EEF1FF',
    textSecondary: '#A5B0DB',
    currentPrayer: '#34D399',
    nextPrayer: '#FBBF24',
    pastPrayer: '#64748B',
    noticeBackground: '#1B2440',
    noticeText: '#C7D2FE',
    noticeAccent: '#60A5FA',
    warningBackground: '#332312',
    warningText: '#FCD34D',
    warningAccent: '#FBBF24',
    headerGradient: ['#7C3AED', '#4F46E5', '#0284C7'],
    itemGradients: [
      ['#7C3AED', '#4F46E5'],
      ['#0284C7', '#0E7490'],
      ['#047857', '#15803D'],
      ['#B45309', '#C2410C'],
      ['#E11D48', '#DB2777'],
      ['#4F46E5', '#2563EB'],
      ['#0F766E', '#0284C7'],
      ['#A21CAF', '#7C3AED'],
    ],
    itemFg: '#FFFFFF',
  },
  pastel: {
    name: 'Pastel',
    nameAr: 'الباستيل',
    fontFamily: FONT_FAMILY,
    primary: '#FBF9FF',
    primaryMedium: '#F1EDFB',
    primaryDark: '#E4DEF5',
    accent: '#6D28D9',
    accentDark: '#5B21B6',
    background: '#FBF9FF',
    surface: '#F1EDFB',
    text: '#3B3355',
    textSecondary: '#7A7299',
    currentPrayer: '#4CAF50',
    nextPrayer: '#FF9800',
    pastPrayer: '#A5A0BD',
    noticeBackground: '#EDE9FE',
    noticeText: '#5B21B6',
    noticeAccent: '#8B5CF6',
    warningBackground: '#FEF3C7',
    warningText: '#B45309',
    warningAccent: '#F59E0B',
    headerGradient: ['#DDD6FE', '#C4B5FD', '#A78BFA'],
    itemGradients: [
      ['#DDD6FE', '#C4B5FD'],
      ['#BAE6FD', '#A5F3FC'],
      ['#BBF7D0', '#A7F3D0'],
      ['#FDE68A', '#FED7AA'],
      ['#FECDD3', '#FBCFE8'],
      ['#C7D2FE', '#BFDBFE'],
      ['#99F6E4', '#BAE6FD'],
      ['#F5D0FE', '#DDD6FE'],
    ],
    itemFg: '#3B3355',
  },
  gilded: {
    name: 'Gilded',
    nameAr: 'مُذهّب',
    fontFamily: FONT_FAMILY,
    primary: '#141210',
    primaryMedium: '#221E19',
    primaryDark: '#0B0A08',
    accent: '#FFE29D',
    accentDark: '#D1955E',
    background: '#141210',
    surface: '#221E19',
    text: '#FFE29D',
    textSecondary: '#D1955E',
    currentPrayer: '#66BB6A',
    nextPrayer: '#FFB74D',
    pastPrayer: '#757575',
    noticeBackground: '#1A2E3A',
    noticeText: '#FFE29D',
    noticeAccent: '#42A5F5',
    warningBackground: '#3A2A1A',
    warningText: '#FFE29D',
    warningAccent: '#FFB74D',
    headerGradient: ['#8C6117', '#D1955E', '#8C6117'],
    itemGradients: [
      ['#8C6117', '#B8804A'],
      ['#065F46', '#047857'],
      ['#7F1D1D', '#9F1239'],
      ['#1E3A8A', '#1D4ED8'],
      ['#581C87', '#6D28D9'],
      ['#7C2D12', '#B45309'],
      ['#134E4A', '#0F766E'],
      ['#701A75', '#86198F'],
    ],
    itemFg: '#FFF8E7',
  }
};

// Recipes describing how each prayer-time variant nudges a theme's base palette
const VARIANT_RECIPES = {
  fajr: { mixColor: '#A9C9E8', mixAmount: 0.14, accentLighten: 0.06 },
  duha: { lightenAmount: 0.08, accentLighten: 0.04 },
  asr: { mixColor: '#D98E4A', mixAmount: 0.14, accentDarken: 0.05 },
  isha: { darkenAmount: 0.16, accentLighten: 0.08 },
};

const shiftSurface = (hex, recipe) => {
  let result = hex;
  if (recipe.mixColor) result = mix(result, recipe.mixColor, recipe.mixAmount);
  if (recipe.lightenAmount) result = lighten(result, recipe.lightenAmount);
  if (recipe.darkenAmount) result = darken(result, recipe.darkenAmount);
  return result;
};

const shiftAccent = (hex, recipe) => {
  let result = hex;
  if (recipe.accentLighten) result = lighten(result, recipe.accentLighten);
  if (recipe.accentDarken) result = darken(result, recipe.accentDarken);
  return result;
};

// Applies a prayer-time variant recipe on top of a theme's base colors
export const applyThemeVariant = (base, variantKey) => {
  const recipe = VARIANT_RECIPES[variantKey];
  if (!recipe) return base;

  return {
    ...base,
    background: shiftSurface(base.background, recipe),
    surface: shiftSurface(base.surface, recipe),
    primary: shiftSurface(base.primary, recipe),
    primaryMedium: shiftSurface(base.primaryMedium, recipe),
    primaryDark: shiftSurface(base.primaryDark, recipe),
    accent: shiftAccent(base.accent, recipe),
    accentDark: shiftAccent(base.accentDark, recipe),
  };
};

export const getThemeVariant = (themeKey, variantKey, themeMap = themes) =>
  applyThemeVariant(themeMap[themeKey] || themes.goldOnDark, variantKey);
