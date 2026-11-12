import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/constants/Colors';
import { useAudio } from '@/utils/audio/Sounds';
import { getFontSize, saveFontSize } from '@/utils/FontSize';
import { APP_KEYS } from '@/constants/StorageKeys';

export function useSettingsForm() {
  const { theme, setTheme } = useTheme();
  const { volume, setClickVolume, playClick } = useAudio();

  const [autoSave, setAutoSave] = useState(true);
  const [initialScreen, setInitialScreen] = useState('Fav');
  const [tempScreen, setTempScreen] = useState('Fav');
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempVolume, setTempVolume] = useState(0.9);
  const [fontSize, setFontSize] = useState(18);
  const [tempFontSize, setTempFontSize] = useState(18);
  const [viewMode, setViewMode] = useState('swiper');
  const [tempViewMode, setTempViewMode] = useState('swiper');
  const [lastSavedScreen, setLastSavedScreen] = useState('Fav');
  const [lastSavedVolume, setLastSavedVolume] = useState(0.9);
  const [lastSavedFontSize, setLastSavedFontSize] = useState(18);
  const [lastSavedViewMode, setLastSavedViewMode] = useState('swiper');

  const volumeSaveTimeoutRef = useRef(null);
  const fontSizeSaveTimeoutRef = useRef(null);
  const isUserInteractingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [screen, storedViewMode, storedAutoSave] = await Promise.all([
          AsyncStorage.getItem(APP_KEYS.INITIAL_SCREEN),
          AsyncStorage.getItem(APP_KEYS.VIEW_MODE),
          AsyncStorage.getItem(APP_KEYS.AUTO_SAVE),
        ]);

        setTempTheme(theme);

        const currentFontSize = await getFontSize();
        setFontSize(currentFontSize);
        setTempFontSize(currentFontSize);
        setLastSavedFontSize(currentFontSize);

        const currentViewMode = storedViewMode || 'swiper';
        if (!storedViewMode) {
          await AsyncStorage.setItem(APP_KEYS.VIEW_MODE, currentViewMode);
        }
        setViewMode(currentViewMode);
        setTempViewMode(currentViewMode);
        setLastSavedViewMode(currentViewMode);

        const currentAutoSave = storedAutoSave !== null ? storedAutoSave === 'true' : true;
        if (storedAutoSave === null) {
          await AsyncStorage.setItem(APP_KEYS.AUTO_SAVE, 'true');
        }
        setAutoSave(currentAutoSave);

        const currentScreen = screen || 'Fav';
        if (!screen) {
          await AsyncStorage.setItem(APP_KEYS.INITIAL_SCREEN, currentScreen);
        }
        setInitialScreen(currentScreen);
        setTempScreen(currentScreen);
        setLastSavedScreen(currentScreen);

        setTempVolume(volume);
        setLastSavedVolume(volume);
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    };
    load();
  }, [volume, theme]);

  useEffect(() => {
    return () => {
      if (volumeSaveTimeoutRef.current) clearTimeout(volumeSaveTimeoutRef.current);
      if (fontSizeSaveTimeoutRef.current) clearTimeout(fontSizeSaveTimeoutRef.current);
    };
  }, []);

  const handleVolumeChange = (value) => {
    isUserInteractingRef.current = true;
    setTempVolume(value);
  };

  const handleVolumeChangeComplete = (value) => {
    isUserInteractingRef.current = false;
    playClick(value);
    if (autoSave) {
      if (volumeSaveTimeoutRef.current) clearTimeout(volumeSaveTimeoutRef.current);
      volumeSaveTimeoutRef.current = setTimeout(() => {
        if (!isUserInteractingRef.current) {
          setClickVolume(value);
          setLastSavedVolume(value);
        }
      }, 100);
    }
  };

  const handleFontSizeChange = (value) => {
    isUserInteractingRef.current = true;
    setTempFontSize(Math.round(value));
  };

  const handleFontSizeChangeComplete = (value) => {
    isUserInteractingRef.current = false;
    const newValue = Math.round(value);
    if (autoSave) {
      if (fontSizeSaveTimeoutRef.current) clearTimeout(fontSizeSaveTimeoutRef.current);
      fontSizeSaveTimeoutRef.current = setTimeout(async () => {
        if (!isUserInteractingRef.current) {
          await saveFontSize(newValue);
          setFontSize(newValue);
          setLastSavedFontSize(newValue);
        }
      }, 100);
    }
  };

  const handleAutoSaveToggle = async () => {
    playClick();
    const newAutoSave = !autoSave;
    setAutoSave(newAutoSave);
    await AsyncStorage.setItem(APP_KEYS.AUTO_SAVE, newAutoSave.toString());
  };

  const handleScreenChange = (screen) => {
    playClick();
    setTempScreen(screen);
    if (autoSave) {
      setTimeout(async () => {
        await AsyncStorage.setItem(APP_KEYS.INITIAL_SCREEN, screen);
        setInitialScreen(screen);
        setLastSavedScreen(screen);
      }, 100);
    }
  };

  const handleThemeChange = async (themeKey) => {
    playClick();
    setTempTheme(themeKey);
    await setTheme(themeKey);
  };

  const handleViewModeChange = (mode) => {
    playClick();
    setTempViewMode(mode);
    if (autoSave) {
      setTimeout(async () => {
        await AsyncStorage.setItem(APP_KEYS.VIEW_MODE, mode);
        setViewMode(mode);
        setLastSavedViewMode(mode);
      }, 100);
    }
  };

  const applyForm = async () => {
    if (tempVolume !== volume) {
      setClickVolume(tempVolume);
      setLastSavedVolume(tempVolume);
    }
    if (tempTheme !== theme) {
      await setTheme(tempTheme);
    }
    if (tempFontSize !== fontSize) {
      await saveFontSize(tempFontSize);
      setFontSize(tempFontSize);
      setLastSavedFontSize(tempFontSize);
    }
    if (tempViewMode !== viewMode) {
      await AsyncStorage.setItem(APP_KEYS.VIEW_MODE, tempViewMode);
      setViewMode(tempViewMode);
      setLastSavedViewMode(tempViewMode);
    }
    if (tempScreen !== initialScreen) {
      await AsyncStorage.setItem(APP_KEYS.INITIAL_SCREEN, tempScreen);
      setInitialScreen(tempScreen);
      setLastSavedScreen(tempScreen);
    }
  };

  const resetForm = async () => {
    setTempVolume(0.9);
    setTempTheme('originalGreen');
    setTempFontSize(18);
    setTempScreen('Fav');
    setTempViewMode('swiper');
    await setTheme('originalGreen');
    if (autoSave) {
      setClickVolume(0.9);
      setLastSavedVolume(0.9);
      await saveFontSize(18);
      setFontSize(18);
      setLastSavedFontSize(18);
      await AsyncStorage.setItem(APP_KEYS.INITIAL_SCREEN, 'Fav');
      setInitialScreen('Fav');
      setLastSavedScreen('Fav');
      await AsyncStorage.setItem(APP_KEYS.VIEW_MODE, 'swiper');
      setViewMode('swiper');
      setLastSavedViewMode('swiper');
    }
  };

  const hasUnsavedForm = useCallback(() => {
    if (tempScreen !== lastSavedScreen) return true;
    if (tempVolume !== lastSavedVolume) return true;
    if (tempFontSize !== lastSavedFontSize) return true;
    if (tempViewMode !== lastSavedViewMode) return true;
    return false;
  }, [tempScreen, lastSavedScreen, tempVolume, lastSavedVolume, tempFontSize, lastSavedFontSize, tempViewMode, lastSavedViewMode]);

  return {
    autoSave,
    initialScreen,
    tempScreen,
    tempTheme,
    tempVolume,
    tempFontSize,
    tempViewMode,
    handleVolumeChange,
    handleVolumeChangeComplete,
    handleFontSizeChange,
    handleFontSizeChangeComplete,
    handleAutoSaveToggle,
    handleScreenChange,
    handleThemeChange,
    handleViewModeChange,
    applyForm,
    resetForm,
    hasUnsavedForm,
  };
}
