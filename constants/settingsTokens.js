import { Platform } from 'react-native';

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const RADIUS = { control: 10, card: 14, modal: 16, pill: 999 };

export const CONTENT_MAX_WIDTH = 640;

export const DANGER = '#D9534F';

const ALPHA = {
  hairline: 0.12,
  subtle: 0.08,
  activeRow: 0.14,
  border: 0.28,
  muted: 0.4,
  strong: 0.5,
};

const toHex2 = (n) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');

export const withAlpha = (color, amount) => {
  if (typeof color !== 'string') return color;
  const a = typeof amount === 'number' ? amount : (ALPHA[amount] ?? 1);
  if (color.length === 7 && color[0] === '#') return color + toHex2(a);
  if (color.length === 4 && color[0] === '#') {
    const r = color[1], g = color[2], b = color[3];
    return `#${r}${r}${g}${g}${b}${b}${toHex2(a)}`;
  }
  return color;
};

export const shadow = (shadowColor) => Platform.select({
  web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.12)' },
  default: {
    shadowColor: shadowColor || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});

export const webCursor = Platform.OS === 'web' ? { cursor: 'pointer' } : null;
