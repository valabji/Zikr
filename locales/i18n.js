import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restart } from '../utils/restart';
import { applyRTLToDocument, applyWebRTLStyles } from '../utils/webRTL';
import ar from './ar.json';
import en from './en.json';

const translations = {
  ar,
  en
};

let currentLanguage = 'ar'; // Default language

// Web RTL support
const setWebRTL = (isRTL) => {
  if (Platform.OS === 'web') {
    applyRTLToDocument(isRTL);
    applyWebRTLStyles(isRTL);
  }
};

export const setLanguage = async (lang, restart = true) => {
  if (translations[lang]) {
    currentLanguage = lang;
    await AsyncStorage.setItem('@language', lang);

    const isRTL = lang === 'ar';

    // Handle RTL for mobile (React Native)
    if (Platform.OS !== 'web') {
      if (isRTL && !I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } else if (!isRTL && I18nManager.isRTL) {
        I18nManager.forceRTL(false);
        I18nManager.allowRTL(false);
      }
    } else {
      // Handle RTL for web
      setWebRTL(isRTL);
      // For web, we don't need to restart the app
    }
    if (restart) {
      Restart(); // Restart the app to apply changes
    }
  }
};

export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return the key if translation not found
    }
  }

  if (typeof value === 'string') {
    // Replace parameters in string if any
    return value.replace(/{(\w+)}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  return value;
};

// Get current language direction
export const isRTL = () => {
  if (Platform.OS === 'web') {
    return currentLanguage === 'ar';
  }
  return I18nManager.isRTL;
};

// Get current language
export const getCurrentLanguage = () => currentLanguage;

// Utility functions for RTL-aware spacing (for use outside of React components)
// Note: Only needed for web - mobile platforms handle RTL automatically via I18nManager
export const getDirectionalSpacing = (leftValue, rightValue) => {
  // On mobile, let I18nManager handle RTL automatically
  if (Platform.OS !== 'web') {
    return { marginLeft: leftValue, marginRight: rightValue };
  }
  
  // On web, manually handle RTL
  return isRTL() ? 
    { marginRight: leftValue, marginLeft: rightValue } :
    { marginLeft: leftValue, marginRight: rightValue };
};

export const getDirectionalPadding = (leftValue, rightValue) => {
  // On mobile, let I18nManager handle RTL automatically
  if (Platform.OS !== 'web') {
    return { paddingLeft: leftValue, paddingRight: rightValue };
  }
  
  // On web, manually handle RTL
  return isRTL() ? 
    { paddingRight: leftValue, paddingLeft: rightValue } :
    { paddingLeft: leftValue, paddingRight: rightValue };
};

export const getDirectionalMixedSpacing = ({ 
  marginLeft, 
  marginRight, 
  paddingLeft, 
  paddingRight 
}) => {
  // On mobile, let I18nManager handle RTL automatically
  if (Platform.OS !== 'web') {
    const spacing = {};
    if (marginLeft !== undefined) spacing.marginLeft = marginLeft;
    if (marginRight !== undefined) spacing.marginRight = marginRight;
    if (paddingLeft !== undefined) spacing.paddingLeft = paddingLeft;
    if (paddingRight !== undefined) spacing.paddingRight = paddingRight;
    return spacing;
  }
  
  // On web, manually handle RTL
  const spacing = {};
  const rtl = isRTL();
  
  if (marginLeft !== undefined || marginRight !== undefined) {
    if (rtl) {
      if (marginLeft !== undefined) spacing.marginRight = marginLeft;
      if (marginRight !== undefined) spacing.marginLeft = marginRight;
    } else {
      if (marginLeft !== undefined) spacing.marginLeft = marginLeft;
      if (marginRight !== undefined) spacing.marginRight = marginRight;
    }
  }
  
  if (paddingLeft !== undefined || paddingRight !== undefined) {
    if (rtl) {
      if (paddingLeft !== undefined) spacing.paddingRight = paddingLeft;
      if (paddingRight !== undefined) spacing.paddingLeft = paddingRight;
    } else {
      if (paddingLeft !== undefined) spacing.paddingLeft = paddingLeft;
      if (paddingRight !== undefined) spacing.paddingRight = paddingRight;
    }
  }
  
  return spacing;
};

// Initialize language from storage
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('@language');
    if (savedLanguage) {
      await setLanguage(savedLanguage, false);
    } else {
      await setLanguage(currentLanguage, Platform.OS !== 'web');
    }
  } catch (error) {
    console.warn('Error loading language:', error);
  }
};

// Get RTL-aware text alignment
export const getRTLTextAlign = (defaultAlign = 'left') => {
  // On mobile, let I18nManager handle RTL automatically
  if (Platform.OS !== 'web') {
    return 'auto';
  }
  
  // On web, manually handle RTL
  if (defaultAlign === 'center') return 'center';
  
  const rtl = isRTL();
  if (rtl) {
    return defaultAlign === 'left' ? 'right' : 'left';
  }
  
  return defaultAlign;
};
