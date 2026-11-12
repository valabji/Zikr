import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_KEYS } from '@/constants/StorageKeys';

const DEFAULT_FONT_SIZE = 18;

export const getFontSize = async () => {
  try {
    const storedFontSize = await AsyncStorage.getItem(APP_KEYS.FONT_SIZE);
    return storedFontSize ? parseInt(storedFontSize) : DEFAULT_FONT_SIZE;
  } catch (error) {
    console.warn('Failed to load font size:', error);
    return DEFAULT_FONT_SIZE;
  }
};

export const saveFontSize = async (fontSize) => {
  try {
    await AsyncStorage.setItem(APP_KEYS.FONT_SIZE, fontSize.toString());
    return true;
  } catch (error) {
    console.warn('Failed to save font size:', error);
    return false;
  }
};
