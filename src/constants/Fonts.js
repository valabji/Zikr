// Font configuration for the app
export const FONT_FAMILY = 'Cairo_400Regular';

// Text style presets that include the font family
export const textStyles = {
  // Base text style that should be used for all text
  base: {
    fontFamily: FONT_FAMILY,
  },
  
  // Common text size variants
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '600',
  },
  
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
  },
  
  bodySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  
  // Header text
  header: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: 'normal',
  },
  
  // Navigation text
  navigation: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
  },
  
  // Prayer time specific styles
  prayerTime: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
  },
  
  prayerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
  },
  
  // Utility function to merge with custom styles
  withFont: (customStyle = {}) => ({
    fontFamily: FONT_FAMILY,
    ...customStyle,
  }),
};

// Default text props that can be spread into Text components
export const defaultTextProps = {
  style: { fontFamily: FONT_FAMILY },
};
