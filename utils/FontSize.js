import AsyncStorage from '@react-native-async-storage/async-storage';

// Default font size for Zikr text
const DEFAULT_FONT_SIZE = 18;

// Get the saved font size from storage
export const getFontSize = async () => {
  try {
    const storedFontSize = await AsyncStorage.getItem('@fontSize');
    return storedFontSize ? parseInt(storedFontSize) : DEFAULT_FONT_SIZE;
  } catch (error) {
    console.warn('Failed to load font size:', error);
    return DEFAULT_FONT_SIZE;
  }
};

// Save font size to storage
export const saveFontSize = async (fontSize) => {
  try {
    await AsyncStorage.setItem('@fontSize', fontSize.toString());
    return true;
  } catch (error) {
    console.warn('Failed to save font size:', error);
    return false;
  }
};
