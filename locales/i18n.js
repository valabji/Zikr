import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restart } from '../utils/restart';
import { applyRTLToDocument, applyWebRTLStyles } from '../utils/webRTL';
import ar from './ar.json';
import en from './en.json';
import moment from 'moment-timezone';
import 'moment/locale/ar';

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

    // Set moment locale but configure to use English numerals
    if (lang === 'ar') {
      moment.locale('ar');
      // Override the Arabic locale to use English numerals
      moment.updateLocale('ar', {
        preparse: function (string) {
          return string;
        },
        postformat: function (string) {
          return string;
        }
      });
    } else {
      moment.locale('en');
    }

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

// Arabic time formatting helpers
export const formatArabicTime = (time, use24Hour = false) => {
  if (!time) return '';
  
  if (currentLanguage === 'ar') {
    // Force English locale for numbers but keep Arabic AM/PM
    const timeStr = time.locale('en').format(use24Hour ? 'HH:mm' : 'h:mm A');
    
    // Convert AM/PM to Arabic but keep English numerals
    const arabicTimeStr = timeStr
      .replace(/AM/g, 'ص')
      .replace(/PM/g, 'م');
    
    return arabicTimeStr;
  }
  
  return time.format(use24Hour ? 'HH:mm' : 'h:mm A');
};

export const formatArabicCountdown = (timeString) => {
  if (!timeString || currentLanguage !== 'ar') return timeString;
  
  // Convert time units to Arabic but keep English numerals
  return timeString
    .replace(/h/g, 'س')
    .replace(/m/g, 'د')
    .replace(/s/g, 'ث');
};

export const formatArabicDate = (date) => {
  if (currentLanguage === 'ar') {
    // Get Arabic day and month names but with English numerals
    const dayName = date.locale('ar').format('dddd');
    const monthName = date.locale('ar').format('MMMM');
    const dayNumber = date.locale('en').format('D');
    const year = date.locale('en').format('YYYY');
    
    // Construct date with Arabic text but English numerals
    return `${dayName}، ${dayNumber} ${monthName} ${year}`;
  }
  
  return date.format('dddd, MMMM Do YYYY');
};

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
      // Set default moment locale with English numerals
      if (currentLanguage === 'ar') {
        moment.locale('ar');
        moment.updateLocale('ar', {
          preparse: function (string) {
            return string;
          },
          postformat: function (string) {
            return string;
          }
        });
      } else {
        moment.locale('en');
      }
      await setLanguage(currentLanguage, Platform.OS !== 'web');
    }
  } catch (error) {
    console.warn('Error loading language:', error);
    // Fallback: set moment locale with English numerals
    if (currentLanguage === 'ar') {
      moment.locale('ar');
      moment.updateLocale('ar', {
        preparse: function (string) {
          return string;
        },
        postformat: function (string) {
          return string;
        }
      });
    } else {
      moment.locale('en');
    }
  }
};

// Get RTL-aware text alignment
export const getRTLTextAlign = (defaultAlign = 'left') => {
  // On mobile, let I18nManager handle RTL automatically
  if (Platform.OS !== 'web') {
    return defaultAlign;
  }
  
  // On web, manually handle RTL
  if (defaultAlign === 'center') return 'center';
  
  const rtl = isRTL();
  if (rtl) {
    return defaultAlign === 'left' ? 'right' : 'left';
  }
  
  return defaultAlign;
};
