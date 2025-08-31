import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from './Colors';
import { themes } from './themes';

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('originalGreen');

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
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (theme) => {
    try {
      await AsyncStorage.setItem('@theme', theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme: currentTheme, 
        setTheme, 
        themes 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
