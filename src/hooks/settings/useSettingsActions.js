import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, setLanguage } from '@/locales/i18n';
import { APP_KEYS } from '@/constants/StorageKeys';
import { ROUTE_MAP } from '@/constants/settingsOptions';

export function useSettingsActions({ navigation, playClick, form, vibration }) {
  const [currentLang, setCurrentLang] = useState('ar');
  const [initialLang, setInitialLang] = useState('ar');
  const [languageChanged, setLanguageChanged] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const alertVisibleRef = useRef(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [lang, firstTime] = await Promise.all([
          AsyncStorage.getItem(APP_KEYS.LANGUAGE),
          AsyncStorage.getItem(APP_KEYS.FIRST_TIME_SETTINGS),
        ]);
        if (lang) {
          setCurrentLang(lang);
        }
        setInitialLang(lang || 'ar');
        if (firstTime === null) {
          setIsFirstTime(true);
          navigation.setOptions({ headerLeft: () => null, gestureEnabled: false });
        } else {
          setIsFirstTime(false);
        }
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [navigation]);

  const hasUnsavedChanges = useCallback(() => {
    if (currentLang !== initialLang) return true;
    return form.hasUnsavedForm() || vibration.hasUnsavedVibration();
  }, [currentLang, initialLang, form, vibration]);

  const exitFirstTime = async () => {
    await AsyncStorage.setItem(APP_KEYS.FIRST_TIME_SETTINGS, 'visited');
    setIsFirstTime(false);
    navigation.setOptions({ headerLeft: undefined, gestureEnabled: true });
  };

  const handleLanguageChange = async (lang) => {
    if (lang !== currentLang) {
      playClick();
      await setLanguage(lang, false);
      setCurrentLang(lang);
      setInitialLang(lang);
      setLanguageChanged(true);
    }
  };

  const handleDefault = async () => {
    playClick();
    await form.resetForm();
    await handleLanguageChange('ar');
    await vibration.resetVibration();
  };

  const handleSave = async () => {
    playClick();
    const wasFirstTime = isFirstTime;
    await form.applyForm();
    await vibration.applyVibration();
    if (isFirstTime) await exitFirstTime();

    if (languageChanged) {
      await setLanguage(currentLang, true);
      return;
    }

    if (wasFirstTime) {
      const target = ROUTE_MAP[form.tempScreen] || ROUTE_MAP.Fav;
      navigation.navigate(target.route, target.params);
      return;
    }

    if (form.tempScreen !== form.initialScreen) {
      const target = ROUTE_MAP[form.tempScreen];
      if (target) {
        navigation.navigate(target.route, target.params);
      }
    } else {
      navigation.goBack();
    }
  };

  const handleBackPress = async () => {
    if (alertVisibleRef.current) return;
    if (hasUnsavedChanges()) {
      alertVisibleRef.current = true;
      Alert.alert(
        t('common.unsavedChanges'),
        t('common.unsavedChangesMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => { alertVisibleRef.current = false; },
          },
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: async () => {
              alertVisibleRef.current = false;
              if (isFirstTime) await exitFirstTime();
              navigation.goBack();
            },
          },
          {
            text: t('common.save'),
            style: 'default',
            onPress: async () => {
              try {
                await handleSave();
                alertVisibleRef.current = false;
              } catch (error) {
                console.error('Error saving settings:', error);
                alertVisibleRef.current = false;
              }
            },
          },
        ],
        { cancelable: true, onDismiss: () => { alertVisibleRef.current = false; } }
      );
    } else {
      if (isFirstTime) await exitFirstTime();
      navigation.goBack();
    }
  };

  return { currentLang, isFirstTime, handleLanguageChange, handleDefault, handleSave, handleBackPress };
}
