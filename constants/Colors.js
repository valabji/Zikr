import { useMemo, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from './themes';

// Theme Context
export const ThemeContext = createContext({
  theme: 'originalGreen',
  setTheme: () => {},
  themes: themes,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if not within ThemeProvider
    return {
      theme: 'originalGreen',
      setTheme: () => {},
      themes: themes,
    };
  }
  return context;
};

// Export themes for direct access if needed
export { themes };

// Helper function to detect if current theme has a bright background
export const useIsBrightTheme = () => {
  const { theme } = useTheme();
  
  return useMemo(() => {
    const brightThemes = ['goldOnWhite', 'paige'];
    return brightThemes.includes(theme);
  }, [theme]);
};

export const useColors = () => {
  const { theme } = useTheme();
  
  return useMemo(() => {
    const currentTheme = themes[theme] || themes.originalGreen;
    
    return {
      // Font configuration from theme
      fontFamily: currentTheme.fontFamily,
      
      // Theme-based colors
      primary: currentTheme.primary,
      primaryMedium: currentTheme.primaryMedium,
      primaryDark: currentTheme.primaryDark,
      accent: currentTheme.accent,
      accentDark: currentTheme.accentDark,
      background: currentTheme.background,
      surface: currentTheme.surface,
      text: currentTheme.text,
      textSecondary: currentTheme.textSecondary,
      
      // Prayer time colors (theme-based)
      currentPrayer: currentTheme.currentPrayer,
      nextPrayer: currentTheme.nextPrayer,
      pastPrayer: currentTheme.pastPrayer,
      
      // Notice and warning colors (theme-based)
      noticeBackground: currentTheme.noticeBackground,
      noticeText: currentTheme.noticeText,
      noticeAccent: currentTheme.noticeAccent,
      warningBackground: currentTheme.warningBackground,
      warningText: currentTheme.warningText,
      warningAccent: currentTheme.warningAccent,
      
      // Common Colors (theme-independent)
      white: '#FFFFFF',
      black: '#000000',
      shadowColor: '#000000',
      overlayBackground: 'rgba(0, 0, 0, 0.7)',
      headerBackground: '#DDDDDD',
      borderColor: '#FFFFFF',
      tabIconDefault: '#CCCCCC',
      
      // Legacy naming for backward compatibility
      BYellow: currentTheme.accent, // Maps to accent
      DYellow: currentTheme.accentDark, // Maps to accentDark
      BGreen: currentTheme.primary, // Maps to primary
      MGreen: currentTheme.primaryMedium, // Maps to primaryMedium
      DGreen: currentTheme.primaryDark, // Maps to primaryDark
      
      // Original Green Theme (for direct access)
      originalGreen: '#003C34',
      originalGreenMedium: '#002B25',
      originalGreenDark: '#002520',
      
      // Gold Theme Colors (for direct access)
      goldOnWhite: '#D1955E',
      goldOnDark: '#FFE29D',
    };
  }, [theme]);
};

// For backward compatibility, export the colors object as well
export default {
  // Original Green Theme
  originalGreen: '#003C34',
  originalGreenMedium: '#002B25',
  originalGreenDark: '#002520',
  
  // Gold Theme Colors
  goldOnWhite: '#D1955E',
  goldOnDark: '#FFE29D',
  
  // Common Colors
  white: '#FFFFFF',
  black: '#000000',
  shadowColor: '#000000',
  overlayBackground: 'rgba(0, 0, 0, 0.7)',
  headerBackground: '#DDDDDD',
  borderColor: '#FFFFFF',
  tabIconDefault: '#CCCCCC',
  
  // Legacy naming for backward compatibility
  BYellow: '#FFE29D',
  DYellow: '#D1955E',
  BGreen: '#003C34', 
  MGreen: '#002B25',
  DGreen: '#002520',
};
