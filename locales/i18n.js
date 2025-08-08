import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restart } from '../utils/restart'
import ar from './ar.json';
import en from './en.json';

const translations = {
  ar,
  en
};

let currentLanguage = 'ar'; // Default language

export const setLanguage = async (lang,restart=true) => {
  if (translations[lang]) {
    currentLanguage = lang;
    await AsyncStorage.setItem('@language', lang);
    // Handle RTL for Arabic
    if (lang === 'ar' && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
    } else if (lang !== 'ar' && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
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

// Initialize language from storage
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('@language');
    if (savedLanguage) {
      await setLanguage(savedLanguage,false);
    }
  } catch (error) {
    console.warn('Error loading language:', error);
  }
};
