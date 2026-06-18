import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from './Colors';
import { themes } from './themes';
import { getCurrentPrayerVariant, THEME_VARIANT_KEYS } from '../utils/ThemeVariant';

const VARIANT_AUTO_KEY = '@theme_variant_auto';
const VARIANT_LOCKED_KEY = '@theme_variant_locked';
const VARIANT_REFRESH_MS = 60000;

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('goldOnDark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [autoVariant, setAutoVariantState] = useState(true);
  const [lockedVariant, setLockedVariantState] = useState(null);
  const [computedVariant, setComputedVariant] = useState(null);

  // Load theme from storage on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme');
        if (savedTheme) {
          setCurrentTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        // Mark theme as loaded regardless of success/failure
        setIsThemeLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Auto mode and the locked variant are stored separately so re-enabling
  // auto mode resumes cycling without losing the previous lock choice
  useEffect(() => {
    const loadVariantPrefs = async () => {
      try {
        const [savedAuto, savedLocked] = await Promise.all([
          AsyncStorage.getItem(VARIANT_AUTO_KEY),
          AsyncStorage.getItem(VARIANT_LOCKED_KEY),
        ]);
        if (savedAuto !== null) {
          setAutoVariantState(savedAuto !== 'false');
        }
        if (savedLocked && THEME_VARIANT_KEYS.includes(savedLocked)) {
          setLockedVariantState(savedLocked);
        }
      } catch (error) {
        console.error('Error loading theme variant preferences:', error);
      }
    };

    loadVariantPrefs();
  }, []);

  // Recompute the current prayer-time period periodically to drive auto mode
  useEffect(() => {
    let cancelled = false;

    const refreshComputedVariant = async () => {
      const period = await getCurrentPrayerVariant();
      if (!cancelled) {
        setComputedVariant(period);
      }
    };

    refreshComputedVariant();
    const interval = setInterval(refreshComputedVariant, VARIANT_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const setTheme = async (theme) => {
    try {
      await AsyncStorage.setItem('@theme', theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setAutoVariantEnabled = async (enabled) => {
    try {
      await AsyncStorage.setItem(VARIANT_AUTO_KEY, enabled ? 'true' : 'false');
      setAutoVariantState(enabled);
    } catch (error) {
      console.error('Error saving theme variant auto mode:', error);
    }
  };

  const lockVariant = async (variantKey) => {
    if (!THEME_VARIANT_KEYS.includes(variantKey)) return;
    try {
      await Promise.all([
        AsyncStorage.setItem(VARIANT_LOCKED_KEY, variantKey),
        AsyncStorage.setItem(VARIANT_AUTO_KEY, 'false'),
      ]);
      setLockedVariantState(variantKey);
      setAutoVariantState(false);
    } catch (error) {
      console.error('Error locking theme variant:', error);
    }
  };

  const variant = autoVariant ? computedVariant : (lockedVariant || computedVariant);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme,
        themes,
        isThemeLoaded,
        variant,
        autoVariant,
        lockedVariant,
        setAutoVariantEnabled,
        lockVariant,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
