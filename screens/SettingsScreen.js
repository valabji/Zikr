import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useTheme } from '../constants/Colors';
import { useRTL } from '../hooks/useRTL';
import { textStyles } from '../constants/Fonts';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, shadow, webCursor } from '../constants/settingsTokens';
import { t, setLanguage } from '../locales/i18n';
import CustomHeader from '../components/CHeader';
import Azkar from '../constants/Azkar';
import { THEME_VARIANT_KEYS } from '../constants/themes';
import vibrationManager, { VIBRATION_TYPES, VIBRATION_INTENSITY } from '../utils/Vibration';
import { useTestedMode, setTestedMode } from '../utils/TestedMode';
import { DEFAULT_MENU_CONFIG, ITEM_DEFS, splitMenuForTabs } from '../constants/MenuConfig';
import { useNavMode } from '../utils/NavMode';
import { useAudio } from '../utils/Sounds';
import {
  SettingsContainer, SettingsSection, SettingsRow, SettingsField,
  SettingsToggle, SettingsSegmented, SettingsSlider, SettingsButton, SettingsSelect,
} from '../components/settings';

export default function SettingsScreen({ navigation }) {
  const colors = useColors();
  const { theme, setTheme, themes, variant, autoVariant, lockedVariant, setAutoVariantEnabled, lockVariant } = useTheme();
  const { volume, setClickVolume, playClick } = useAudio();
  const { isRTL, getTextAlign, getDirectionalMixedSpacing } = useRTL();

  const [currentLang, setCurrentLang] = useState('ar');
  const [initialScreen, setInitialScreen] = useState('Fav');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [tempScreen, setTempScreen] = useState('Fav');
  const [tempVolume, setTempVolume] = useState(0.9);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempFontSize, setTempFontSize] = useState(18);
  const [fontSize, setFontSize] = useState(18);
  const [tempViewMode, setTempViewMode] = useState('swiper');
  const [viewMode, setViewMode] = useState('swiper');
  const [autoSave, setAutoSave] = useState(true);
  const [languageChanged, setLanguageChanged] = useState(false);
  const [tempTasbihVibration, setTempTasbihVibration] = useState(false);
  const [tempAzkarVibration, setTempAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [tempVibrationIntensity, setTempVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [tasbihVibration, setTasbihVibration] = useState(false);
  const [azkarVibration, setAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [vibrationIntensity, setVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const testedMode = useTestedMode();
  const { navMode, setNavMode } = useNavMode();
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [showDate, setShowDate] = useState(true);

  const [initialLang, setInitialLang] = useState('ar');
  const [lastSavedScreen, setLastSavedScreen] = useState('Fav');
  const [lastSavedVolume, setLastSavedVolume] = useState(0.9);
  const [lastSavedFontSize, setLastSavedFontSize] = useState(18);
  const [lastSavedViewMode, setLastSavedViewMode] = useState('swiper');
  const [lastSavedTasbihVibration, setLastSavedTasbihVibration] = useState(false);
  const [lastSavedAzkarVibration, setLastSavedAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [lastSavedVibrationIntensity, setLastSavedVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isTutorialVisible, setTutorialVisible] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightVisible, setHighlightVisible] = useState(false);

  const volumeSaveTimeoutRef = useRef(null);
  const fontSizeSaveTimeoutRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const scrollViewRef = useRef(null);
  const targetY = useRef({});

  const tutorialProgress = useSharedValue(0);

  const screens = [
    { id: 'All', labelEn: 'All Azkar', labelAr: 'كل الاذكار' },
    { id: 'Fav', labelEn: 'Favorites', labelAr: 'الاذكار المفضلة' },
    { id: 'Tasbih', labelEn: 'Tasbih Counter', labelAr: 'المسبحة' },
    { id: 'PrayerTimes', labelEn: 'Prayer Times', labelAr: 'مواقيت الصلاة' },
    { id: 'Qibla', labelEn: 'Qibla Direction', labelAr: 'اتجاه القبلة' },
    { id: 'Quran', labelEn: 'Holy Quran', labelAr: 'القرآن الكريم' },
    { id: 'Books', labelEn: 'Islamic Library', labelAr: 'المكتبة الإسلامية' },
    { id: 'Radio', labelEn: 'Radio', labelAr: 'الراديو' },
  ];

  const viewModes = [
    { id: 'swiper', labelEn: 'Swiper (Page by Page)', labelAr: 'التمرير (صفحة بصفحة)' },
    { id: 'onePageScroll', labelEn: 'One Page Scroll', labelAr: 'التمرير المستمر' },
    { id: 'onePageScrollCompact', labelEn: 'One Page Scroll Compact', labelAr: 'التمرير المستمر المضغوط' },
  ];

  const vibrationOptions = [
    { id: VIBRATION_TYPES.OFF, labelEn: 'Off', labelAr: 'إيقاف' },
    { id: VIBRATION_TYPES.ON_NEXT, labelEn: 'Only when moving to next zikr', labelAr: 'فقط عند الانتقال للذكر التالي' },
    { id: VIBRATION_TYPES.ON_EVERY, labelEn: 'On every zikr count', labelAr: 'عند كل عدة ذكر' },
  ];

  const intensityOptions = [
    { id: VIBRATION_INTENSITY.LIGHT, labelEn: 'Light', labelAr: 'خفيف' },
    { id: VIBRATION_INTENSITY.MEDIUM, labelEn: 'Medium', labelAr: 'متوسط' },
    { id: VIBRATION_INTENSITY.HEAVY, labelEn: 'Heavy', labelAr: 'قوي' },
  ];

  const label = (opt) => (currentLang === 'ar' ? opt.labelAr : opt.labelEn);
  const themeOptions = Object.entries(themes).map(([id, v]) => ({ id, label: currentLang === 'ar' ? v.nameAr : v.name }));
  const screenOptions = screens.map((s) => ({ id: s.id, label: label(s) }));
  const viewModeOptions = viewModes.map((m) => ({ id: m.id, label: label(m) }));
  const azkarVibrationOptions = vibrationOptions.map((o) => ({ id: o.id, label: label(o) }));
  const intensitySelectOptions = intensityOptions.map((o) => ({ id: o.id, label: label(o) }));

  const showVibration = vibrationSupported && Platform.OS !== 'web';

  const tutorialSteps = useMemo(() => [
    { key: 'language', title: t('settings.language'), description: t('settings.tutorial.language') },
    { key: 'autoSave', title: t('settings.autoSave'), description: t('settings.tutorial.autoSave') },
    { key: 'theme', title: t('settings.theme'), description: t('settings.tutorial.theme') },
    { key: 'initialScreen', title: t('settings.initialScreen'), description: t('settings.tutorial.initialScreen') },
    { key: 'viewMode', title: t('settings.viewMode'), description: t('settings.tutorial.viewMode') },
    ...(showVibration ? [
      { key: 'vibrationTasbih', title: t('settings.vibrationTasbih'), description: t('settings.tutorial.vibrationTasbih') },
      { key: 'vibrationAzkar', title: t('settings.vibrationAzkar'), description: t('settings.tutorial.vibrationAzkar') },
      { key: 'vibrationIntensity', title: t('settings.vibrationIntensity'), description: t('settings.tutorial.vibrationIntensity') }
    ] : []),
    { key: 'clickVolume', title: t('settings.clickVolume'), description: t('settings.tutorial.clickVolume') },
    { key: 'fontSize', title: t('settings.fontSize'), description: t('settings.tutorial.fontSize') },
  ], [showVibration, currentLang]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${((currentTutorialStep + 1) / tutorialSteps.length) * 100}%`,
  }));

  useEffect(() => {
    tutorialProgress.value = withTiming((currentTutorialStep + 1) / tutorialSteps.length, { duration: 300 });
  }, [currentTutorialStep]);

  useEffect(() => {
    if (isTutorialVisible && !isAnimating && currentTutorialStep < tutorialSteps.length) {
      const timer = setTimeout(() => {
        startTutorialAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentTutorialStep, isTutorialVisible]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [lang, screen, firstTime, storedFontSize, storedViewMode, storedAutoSave] = await Promise.all([
          AsyncStorage.getItem('@language'),
          AsyncStorage.getItem('@initialScreen'),
          AsyncStorage.getItem('@firstTimeSettings'),
          AsyncStorage.getItem('@fontSize'),
          AsyncStorage.getItem('@viewMode'),
          AsyncStorage.getItem('@autoSave')
        ]);

        if (lang) {
          setCurrentLang(lang);
        }
        setInitialLang(lang || 'ar');

        setTempTheme(theme);

        const defaultFontSize = 18;
        const currentFontSize = storedFontSize ? parseInt(storedFontSize) : defaultFontSize;
        if (!storedFontSize) {
          await AsyncStorage.setItem('@fontSize', defaultFontSize.toString());
        }
        setFontSize(currentFontSize);
        setTempFontSize(currentFontSize);
        setLastSavedFontSize(currentFontSize);

        const defaultViewMode = 'swiper';
        const currentViewMode = storedViewMode || defaultViewMode;
        if (!storedViewMode) {
          await AsyncStorage.setItem('@viewMode', defaultViewMode);
        }
        setViewMode(currentViewMode);
        setTempViewMode(currentViewMode);
        setLastSavedViewMode(currentViewMode);

        const currentAutoSave = storedAutoSave !== null ? storedAutoSave === 'true' : true;
        if (storedAutoSave === null) {
          await AsyncStorage.setItem('@autoSave', 'true');
        }
        setAutoSave(currentAutoSave);

        await vibrationManager.initialize();
        const currentTasbihVibration = vibrationManager.getTasbihSetting();
        const currentAzkarVibration = vibrationManager.getAzkarSetting();
        const currentIntensity = vibrationManager.getIntensity();
        setTasbihVibration(currentTasbihVibration);
        setTempTasbihVibration(currentTasbihVibration);
        setLastSavedTasbihVibration(currentTasbihVibration);
        setAzkarVibration(currentAzkarVibration);
        setTempAzkarVibration(currentAzkarVibration);
        setLastSavedAzkarVibration(currentAzkarVibration);
        setVibrationIntensity(currentIntensity);
        setTempVibrationIntensity(currentIntensity);
        setLastSavedVibrationIntensity(currentIntensity);

        const supported = await vibrationManager.isVibrationSupported();
        setVibrationSupported(supported);

        if (!screen) {
          await AsyncStorage.setItem('@initialScreen', 'Fav');
          setInitialScreen('Fav');
          setTempScreen('Fav');
          setLastSavedScreen('Fav');
        } else {
          setInitialScreen(screen);
          setTempScreen(screen);
          setLastSavedScreen(screen);
        }

        setTempVolume(volume);
        setLastSavedVolume(volume);

        if (firstTime === null) {
          setIsFirstTime(true);
          navigation.setOptions({
            headerLeft: () => null,
            gestureEnabled: false
          });
        } else {
          setIsFirstTime(false);
        }

        const storedMenuConfig = await AsyncStorage.getItem('@menuConfig');
        let parsedMenuConfig = null;
        try { parsedMenuConfig = storedMenuConfig ? JSON.parse(storedMenuConfig) : null; } catch {}
        setMenuConfig(Array.isArray(parsedMenuConfig) ? parsedMenuConfig : DEFAULT_MENU_CONFIG);
        const storedShowDate = await AsyncStorage.getItem('@menuShowDate');
        setShowDate(storedShowDate !== 'false');
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [volume, theme, tempTheme, isFirstTime, navigation]);

  useEffect(() => {
    return () => {
      if (volumeSaveTimeoutRef.current) {
        clearTimeout(volumeSaveTimeoutRef.current);
      }
      if (fontSizeSaveTimeoutRef.current) {
        clearTimeout(fontSizeSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleBackPress = async () => {
    if (isFirstTime) {
      await AsyncStorage.setItem('@firstTimeSettings', 'visited');
      setIsFirstTime(false);
      navigation.setOptions({
        headerLeft: undefined,
        gestureEnabled: true
      });
    }
    if (hasUnsavedChanges() && !isAlertVisible) {
      setIsAlertVisible(true);
      Alert.alert(
        t('common.unsavedChanges'),
        t('common.unsavedChangesMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => setIsAlertVisible(false)
          },
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: () => {
              setIsAlertVisible(false);
              navigation.goBack();
            }
          },
          {
            text: t('common.save'),
            style: 'default',
            onPress: async () => {
              try {
                await handleSave();
                setIsAlertVisible(false);
                navigation.goBack();
              } catch (error) {
                console.error('Error saving settings:', error);
                setIsAlertVisible(false);
                navigation.goBack();
              }
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleVolumeChange = (value) => {
    isUserInteractingRef.current = true;
    setTempVolume(value);
  };

  const handleVolumeChangeComplete = (value) => {
    isUserInteractingRef.current = false;
    playClick(value);

    if (autoSave) {
      if (volumeSaveTimeoutRef.current) {
        clearTimeout(volumeSaveTimeoutRef.current);
      }
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

  const handleFontSizeChangeComplete = async (value) => {
    isUserInteractingRef.current = false;
    const newValue = Math.round(value);

    if (autoSave) {
      if (fontSizeSaveTimeoutRef.current) {
        clearTimeout(fontSizeSaveTimeoutRef.current);
      }
      fontSizeSaveTimeoutRef.current = setTimeout(async () => {
        if (!isUserInteractingRef.current) {
          await AsyncStorage.setItem('@fontSize', newValue.toString());
          setFontSize(newValue);
          setLastSavedFontSize(newValue);
        }
      }, 100);
    }
  };

  const handleAutoSave = async (forceeSave = false) => {
    if (!autoSave && !forceeSave) return;

    if (tempVolume !== volume) {
      setClickVolume(tempVolume);
      setLastSavedVolume(tempVolume);
    }

    if (tempTheme !== theme) {
      await setTheme(tempTheme);
    }

    if (tempFontSize !== fontSize) {
      await AsyncStorage.setItem('@fontSize', tempFontSize.toString());
      setFontSize(tempFontSize);
      setLastSavedFontSize(tempFontSize);
    }

    if (tempViewMode !== viewMode) {
      await AsyncStorage.setItem('@viewMode', tempViewMode);
      setViewMode(tempViewMode);
      setLastSavedViewMode(tempViewMode);
    }

    if (tempTasbihVibration !== tasbihVibration) {
      await vibrationManager.setTasbihVibration(tempTasbihVibration);
      setTasbihVibration(tempTasbihVibration);
      setLastSavedTasbihVibration(tempTasbihVibration);
    }

    if (tempAzkarVibration !== azkarVibration) {
      await vibrationManager.setAzkarVibration(tempAzkarVibration);
      setAzkarVibration(tempAzkarVibration);
      setLastSavedAzkarVibration(tempAzkarVibration);
    }

    if (tempVibrationIntensity !== vibrationIntensity) {
      await vibrationManager.setVibrationIntensity(tempVibrationIntensity);
      setVibrationIntensity(tempVibrationIntensity);
      setLastSavedVibrationIntensity(tempVibrationIntensity);
    }

    if (tempScreen !== initialScreen) {
      await AsyncStorage.setItem('@initialScreen', tempScreen);
      setInitialScreen(tempScreen);
      setLastSavedScreen(tempScreen);
    }
  };

  const handleAutoSaveToggle = async () => {
    playClick();
    const newAutoSave = !autoSave;
    setAutoSave(newAutoSave);
    await AsyncStorage.setItem('@autoSave', newAutoSave.toString());
  };

  const handleTestedModeToggle = async () => {
    playClick();
    await setTestedMode(!testedMode);
  };

  const handleDefault = async () => {
    playClick();
    setTempVolume(0.9);
    setTempTheme('originalGreen');
    setTempFontSize(18);
    setTempScreen('Fav');
    setTempViewMode('swiper');
    setTempTasbihVibration(false);
    setTempAzkarVibration(VIBRATION_TYPES.OFF);
    setTempVibrationIntensity(VIBRATION_INTENSITY.LIGHT);

    await setTheme('originalGreen');
    await handleLanguageChange('ar');

    if (autoSave) {
      setClickVolume(0.9);
      setLastSavedVolume(0.9);

      await AsyncStorage.setItem('@fontSize', '18');
      setFontSize(18);
      setLastSavedFontSize(18);

      await AsyncStorage.setItem('@initialScreen', 'Fav');
      setInitialScreen('Fav');
      setLastSavedScreen('Fav');

      await AsyncStorage.setItem('@viewMode', 'swiper');
      setViewMode('swiper');
      setLastSavedViewMode('swiper');

      await vibrationManager.setTasbihVibration(false);
      setTasbihVibration(false);
      setLastSavedTasbihVibration(false);

      await vibrationManager.setAzkarVibration(VIBRATION_TYPES.OFF);
      setAzkarVibration(VIBRATION_TYPES.OFF);
      setLastSavedAzkarVibration(VIBRATION_TYPES.OFF);

      await vibrationManager.setVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
      setVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
      setLastSavedVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
    }
  };

  const handleSave = async () => {
    playClick();

    const wasFirstTime = isFirstTime;

    if (isFirstTime) {
      await AsyncStorage.setItem('@firstTimeSettings', 'visited');
      setIsFirstTime(false);
      navigation.setOptions({
        headerLeft: undefined,
        gestureEnabled: true
      });
    }

    await handleAutoSave(true);

    if (languageChanged) {
      await setLanguage(currentLang, true);
      return;
    }

    const routeMap = {
      All: { route: 'Home', params: { showFavorites: false } },
      Fav: { route: 'Home', params: { showFavorites: true } },
      Tasbih: { route: 'Screen3' },
      PrayerTimes: { route: 'PrayerTimes' },
      Qibla: { route: 'Qibla' },
      Quran: { route: 'Quran' },
      Books: { route: 'Books' },
      Radio: { route: 'Radio' },
    };

    if (wasFirstTime) {
      const target = routeMap[tempScreen] || routeMap.Fav;
      navigation.navigate(target.route, target.params);
      return;
    }

    if (tempScreen !== initialScreen) {
      const target = routeMap[tempScreen];
      if (target) {
        navigation.navigate(target.route, target.params);
      }
    } else {
      navigation.goBack();
    }
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

  const handleScreenChange = (screen) => {
    playClick();
    setTempScreen(screen);
    if (autoSave) {
      setTimeout(async () => {
        await AsyncStorage.setItem('@initialScreen', screen);
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
        await AsyncStorage.setItem('@viewMode', mode);
        setViewMode(mode);
        setLastSavedViewMode(mode);
      }, 100);
    }
  };

  const handleTasbihVibrationChange = (setting) => {
    playClick();
    setTempTasbihVibration(setting);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setTasbihVibration(setting);
        setTasbihVibration(setting);
        setLastSavedTasbihVibration(setting);
      }, 100);
    }
  };

  const handleAzkarVibrationChange = (setting) => {
    playClick();
    setTempAzkarVibration(setting);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setAzkarVibration(setting);
        setAzkarVibration(setting);
        setLastSavedAzkarVibration(setting);
      }, 100);
    }
  };

  const handleIntensityChange = (intensity) => {
    playClick();
    vibrationManager.performVibration(intensity);
    setTempVibrationIntensity(intensity);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setVibrationIntensity(intensity);
        setVibrationIntensity(intensity);
        setLastSavedVibrationIntensity(intensity);
      }, 100);
    }
  };

  const handleMenuItemToggle = async (idx) => {
    const updated = menuConfig.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item);
    setMenuConfig(updated);
    await AsyncStorage.setItem('@menuConfig', JSON.stringify(updated));
  };

  const handleMenuItemMove = async (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= menuConfig.length) return;
    const updated = [...menuConfig];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setMenuConfig(updated);
    await AsyncStorage.setItem('@menuConfig', JSON.stringify(updated));
  };

  const handleDateToggle = async () => {
    const newVal = !showDate;
    setShowDate(newVal);
    await AsyncStorage.setItem('@menuShowDate', newVal ? 'true' : 'false');
  };

  const handleNavStyleChange = async (mode) => {
    if (mode === navMode) return;
    playClick();
    await AsyncStorage.setItem('@navMode', mode);
    setNavMode(mode);
  };

  const hasUnsavedChanges = useCallback(() => {
    if (tempScreen !== lastSavedScreen) return true;
    if (currentLang !== initialLang) return true;
    if (tempVolume !== lastSavedVolume) return true;
    if (tempFontSize !== lastSavedFontSize) return true;
    if (tempViewMode !== lastSavedViewMode) return true;
    if (tempTasbihVibration !== lastSavedTasbihVibration) return true;
    if (tempAzkarVibration !== lastSavedAzkarVibration) return true;
    if (tempVibrationIntensity !== lastSavedVibrationIntensity) return true;
    return false;
  }, [tempScreen, lastSavedScreen, currentLang, initialLang, tempVolume, lastSavedVolume, tempFontSize, lastSavedFontSize, tempViewMode, lastSavedViewMode, tempTasbihVibration, lastSavedTasbihVibration, tempAzkarVibration, lastSavedAzkarVibration, tempVibrationIntensity, lastSavedVibrationIntensity]);

  const scrollToSetting = (settingKey) => {
    const y = targetY.current[settingKey];
    if (isTutorialVisible && scrollViewRef.current && y !== undefined) {
      scrollViewRef.current.scrollTo({ y: Math.max(y - SPACING.md, 0), animated: true });
    }
  };

  const startTutorialAnimation = () => {
    try {
      if (!isTutorialVisible || currentTutorialStep >= tutorialSteps.length) return;
      setIsAnimating(true);
      setHighlightVisible(true);
      setTimeout(() => {
        try {
          setHighlightVisible(false);
          setIsAnimating(false);
        } catch (error) {
          setIsAnimating(false);
          setHighlightVisible(false);
        }
      }, 500);
    } catch (error) {
      setIsAnimating(false);
      setHighlightVisible(false);
    }
  };

  const nextTutorialStep = () => {
    if (isTutorialVisible && currentTutorialStep < tutorialSteps.length - 1) {
      const nextStep = currentTutorialStep + 1;
      setCurrentTutorialStep(nextStep);
      const nextStepKey = tutorialSteps[nextStep]?.key;
      if (nextStepKey) {
        setTimeout(() => scrollToSetting(nextStepKey), 100);
      }
    }
  };

  const previousTutorialStep = () => {
    if (currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1;
      setCurrentTutorialStep(prevStep);
      const prevStepKey = tutorialSteps[prevStep]?.key;
      if (prevStepKey) {
        setTimeout(() => scrollToSetting(prevStepKey), 100);
      }
    }
  };

  const openTutorial = () => {
    playClick();
    setTutorialVisible(true);
    setCurrentTutorialStep(0);
    setTimeout(() => startTutorialAnimation(), 300);
  };

  const closeTutorial = () => {
    setTutorialVisible(false);
    setCurrentTutorialStep(0);
    setIsAnimating(false);
    setHighlightVisible(false);
    tutorialProgress.value = 0;

    if (scrollViewRef.current) {
      try {
        if (Platform.OS === 'web') {
          const scrollElement = scrollViewRef.current.getScrollableNode
            ? scrollViewRef.current.getScrollableNode()
            : scrollViewRef.current;
          if (scrollElement && scrollElement.scrollTo) {
            scrollElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          } else if (scrollElement && scrollElement.scrollTop !== undefined) {
            scrollElement.scrollTop = 0;
          }
        } else {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      } catch (error) {
        console.warn('Error scrolling to top:', error);
      }
    }
  };

  const registerTarget = (key) => (e) => { targetY.current[key] = e.nativeEvent.layout.y; };

  const target = (key, node) => (
    <View onLayout={registerTarget(key)} style={{ marginBottom: SPACING.xl }}>
      {node}
      {isTutorialVisible && highlightVisible && tutorialSteps[currentTutorialStep]?.key === key ? (
        <View pointerEvents="none" style={{
          position: 'absolute',
          top: -3, left: -3, right: -3, bottom: -3,
          borderWidth: 2,
          borderColor: colors.accent,
          borderRadius: RADIUS.card + 3,
        }} />
      ) : null}
    </View>
  );

  const footer = (
    <View style={[{ flexDirection: 'row',
      gap: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.accent, 'hairline'),
      ...(Platform.OS === 'web' ? { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } : null),
    }]}>
      <SettingsButton
        variant="outline"
        icon="rotate-ccw"
        label={t('settings.default')}
        onPress={handleDefault}
        fullWidth
        style={{ flex: 1 }}
      />
      {!autoSave ? (
        <SettingsButton
          testID="save-settings"
          variant="primary"
          icon="save"
          label={t('common.save')}
          onPress={handleSave}
          fullWidth
          style={{ flex: 1 }}
        />
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="settings-screen">
      <CustomHeader
        title={t("navigation.settings")}
        navigation={navigation}
        Right={isFirstTime && !autoSave ? () => (<View style={{ flex: 1 }} />) : false}
        onBackPress={handleBackPress}
      />

      <SettingsContainer scrollRef={scrollViewRef} footer={footer}>
        <SettingsSection>
          <SettingsRow
            icon="help-circle"
            label={t('settings.tutorial.help')}
            onPress={openTutorial}
            chevron
          />
        </SettingsSection>

        {target('language',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsField label={t('settings.language')}>
              <SettingsSegmented
                value={currentLang}
                options={[{ id: 'en', label: 'English' }, { id: 'ar', label: 'العربية' }]}
                onChange={handleLanguageChange}
                getTestID={(opt) => (opt.id === 'en' ? 'language-toggle' : 'language-toggle-ar')}
              />
            </SettingsField>
          </SettingsSection>
        )}

        {target('autoSave',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsRow
              label={t('settings.autoSave')}
              description={t('settings.autoSaveDescription')}
              trailing={(
                <SettingsToggle
                  testID="auto-save-toggle"
                  value={autoSave}
                  onValueChange={() => handleAutoSaveToggle()}
                />
              )}
            />
          </SettingsSection>
        )}

        {target('theme',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSelect
              triggerTestID="theme-dropdown-trigger"
              label={t('settings.theme')}
              title={t('settings.theme')}
              value={tempTheme}
              options={themeOptions}
              onChange={handleThemeChange}
            />
          </SettingsSection>
        )}

        <SettingsSection testID="theme-variant-section" footnote={t('settings.themeVariantDescription')}>
          <SettingsRow
            label={t('settings.themeVariant')}
            description={t(autoVariant ? 'settings.themeVariantAutoOn' : 'settings.themeVariantAutoOff')}
            trailing={(
              <SettingsToggle
                testID="theme-variant-auto-toggle"
                value={autoVariant}
                onValueChange={(next) => { playClick(); setAutoVariantEnabled(next); }}
              />
            )}
          />
          <SettingsField>
            <SettingsSegmented
              wrap
              value={variant}
              options={THEME_VARIANT_KEYS.map((k) => ({
                id: k,
                label: t(`settings.themeVariants.${k}`),
                icon: (!autoVariant && lockedVariant === k) ? 'lock' : undefined,
              }))}
              onChange={(id) => { playClick(); (!autoVariant && lockedVariant === id) ? setAutoVariantEnabled(true) : lockVariant(id); }}
              getTestID={(opt) => `theme-variant-${opt.id}`}
            />
          </SettingsField>
        </SettingsSection>

        {target('initialScreen',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSelect
              label={t('settings.initialScreen')}
              title={t('settings.initialScreen')}
              placeholder={t('settings.selectScreen')}
              value={tempScreen}
              options={screenOptions}
              onChange={handleScreenChange}
            />
          </SettingsSection>
        )}

        {target('viewMode',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSelect
              label={t('settings.viewMode')}
              title={t('settings.viewMode')}
              placeholder={t('settings.selectViewMode')}
              value={tempViewMode}
              options={viewModeOptions}
              onChange={handleViewModeChange}
            />
          </SettingsSection>
        )}

        {showVibration ? target('vibrationTasbih',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsRow
              label={t('settings.vibrationTasbih')}
              trailing={(
                <SettingsToggle
                  value={tempTasbihVibration}
                  onValueChange={(next) => handleTasbihVibrationChange(next)}
                />
              )}
            />
          </SettingsSection>
        ) : null}

        {showVibration ? target('vibrationAzkar',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSelect
              label={t('settings.vibrationAzkar')}
              title={t('settings.vibrationAzkar')}
              placeholder={t('settings.selectVibration')}
              value={tempAzkarVibration}
              options={azkarVibrationOptions}
              onChange={handleAzkarVibrationChange}
            />
          </SettingsSection>
        ) : null}

        {showVibration ? target('vibrationIntensity',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSelect
              label={t('settings.vibrationIntensity')}
              title={t('settings.vibrationIntensity')}
              placeholder={t('settings.selectIntensity')}
              value={tempVibrationIntensity}
              options={intensitySelectOptions}
              onChange={handleIntensityChange}
            />
          </SettingsSection>
        ) : null}

        {target('clickVolume',
          <SettingsSection style={{ marginBottom: 0 }}>
            <View>
              <Text style={[textStyles.body, {
                color: colors.text,
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.md + 2,
                textAlign: getTextAlign('left'),
              }]}>
                {t('settings.clickVolume')}
              </Text>
              <SettingsSlider
                value={tempVolume}
                min={0}
                max={1}
                onChange={handleVolumeChange}
                onSlidingComplete={handleVolumeChangeComplete}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </View>
          </SettingsSection>
        )}

        {target('fontSize',
          <SettingsSection style={{ marginBottom: 0 }}>
            <View>
              <Text style={[textStyles.body, {
                color: colors.text,
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.md + 2,
                textAlign: getTextAlign('left'),
              }]}>
                {t('settings.fontSize')}
              </Text>
              <SettingsSlider
                value={tempFontSize}
                min={12}
                max={28}
                step={1}
                onChange={handleFontSizeChange}
                onSlidingComplete={handleFontSizeChangeComplete}
                format={(v) => `${Math.round(v)}px`}
                preview={(v) => (
                  <View style={{
                    marginTop: SPACING.md,
                    padding: SPACING.md,
                    backgroundColor: withAlpha(colors.accent, 'subtle'),
                    borderRadius: RADIUS.control,
                  }}>
                    <Text style={[textStyles.caption, {
                      color: colors.textSecondary,
                      marginBottom: SPACING.xs,
                      textAlign: getTextAlign('left'),
                    }]}>
                      {t('settings.preview')}
                    </Text>
                    <Text style={[textStyles.base, {
                      color: colors.text,
                      fontSize: Math.round(v),
                      textAlign: getTextAlign('left'),
                    }]}>
                      {Azkar && Azkar.length > 0 ? Azkar[0].zekr : 'الحمد لله وحده، والصلاة والسلام على من لا نبي بعده'}
                    </Text>
                  </View>
                )}
              />
            </View>
          </SettingsSection>
        )}

        <SettingsSection title={t('settings.menu')}>
          <SettingsField label={t('settings.navStyle')}>
            <SettingsSegmented
              value={navMode}
              options={[
                { id: 'drawer', label: t('settings.navStyleDrawer'), icon: 'menu' },
                { id: 'cards', label: t('settings.navStyleCards'), icon: 'grid' },
              ]}
              onChange={handleNavStyleChange}
              getTestID={(opt) => `nav-style-${opt.id}`}
            />
          </SettingsField>
          <SettingsRow
            label={t('settings.menuShowDate')}
            trailing={(
              <SettingsToggle value={showDate} onValueChange={() => handleDateToggle()} />
            )}
          />
          {menuConfig.map((item, idx) => {
            const def = ITEM_DEFS[item.id];
            if (!def) return null;
            const inBar = navMode === 'cards' && splitMenuForTabs(menuConfig).tabItems.some(i => i.id === item.id);
            return (
              <View key={item.id} style={[{ flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm + 2,
                opacity: item.visible ? 1 : 0.5,
              }]}>
                <View style={getDirectionalMixedSpacing({ marginRight: SPACING.sm })}>
                  <Pressable
                    onPress={() => handleMenuItemMove(idx, -1)}
                    disabled={idx === 0}
                    style={[{ padding: 2, opacity: idx === 0 ? 0.3 : 1 }, webCursor]}
                  >
                    <Feather name="chevron-up" size={18} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMenuItemMove(idx, 1)}
                    disabled={idx === menuConfig.length - 1}
                    style={[{ padding: 2, opacity: idx === menuConfig.length - 1 ? 0.3 : 1 }, webCursor]}
                  >
                    <Feather name="chevron-down" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Feather name={def.icon} size={18} color={colors.accent} style={getDirectionalMixedSpacing({ marginRight: SPACING.md })} />
                <Text style={[textStyles.body, { color: colors.text, flex: 1, textAlign: getTextAlign('left') }]}>
                  {t(def.labelKey)}
                </Text>
                {inBar && (
                  <View style={[{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.accent + '22',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }, getDirectionalMixedSpacing({ marginRight: SPACING.sm })]}>
                    <Feather name="grid" size={11} color={colors.accent} style={getDirectionalMixedSpacing({ marginRight: 4 })} />
                    <Text style={[textStyles.caption, { color: colors.accent }]}>{t('settings.menuBarBadge')}</Text>
                  </View>
                )}
                <Pressable onPress={() => handleMenuItemToggle(idx)} style={[{ padding: 4 }, webCursor]}>
                  <Feather name={item.visible ? 'eye' : 'eye-off'} size={20} color={item.visible ? colors.accent : colors.textSecondary} />
                </Pressable>
              </View>
            );
          })}
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t('settings.testedMode')}
            description={t('settings.testedModeDescription')}
            trailing={(
              <SettingsToggle
                testID="tested-mode-toggle"
                value={testedMode}
                onValueChange={() => handleTestedModeToggle()}
              />
            )}
          />
        </SettingsSection>

        {isTutorialVisible ? <View style={{ height: 300 }} /> : null}
      </SettingsContainer>

      {isTutorialVisible ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 96,
            alignItems: 'center',
            paddingHorizontal: SPACING.sm,
            zIndex: 999,
          }}
        >
          <View style={[{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            backgroundColor: colors.surface,
            borderRadius: RADIUS.modal,
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 'border'),
            overflow: 'hidden',
          }, shadow(colors.shadowColor)]}>
            <View style={{ padding: SPACING.lg, backgroundColor: withAlpha(colors.accent, 'subtle') }}>
              <Text style={[textStyles.subtitle, { color: colors.text, fontWeight: 'bold', textAlign: 'center' }]}>
                {t('settings.tutorial.title')}
              </Text>
              <View style={{ height: 4, borderRadius: 2, marginTop: SPACING.sm, overflow: 'hidden', backgroundColor: withAlpha(colors.accent, 'hairline') }}>
                <Animated.View style={[{ height: '100%', backgroundColor: colors.accent, borderRadius: 2 }, animatedProgressStyle]} />
              </View>
            </View>

            <View style={{ padding: SPACING.lg }}>
              <Text style={[textStyles.body, { color: colors.text, fontWeight: 'bold', marginBottom: SPACING.sm, textAlign: getTextAlign('left') }]}>
                {tutorialSteps[currentTutorialStep]?.title}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.textSecondary, lineHeight: 22, textAlign: getTextAlign('left') }]}>
                {tutorialSteps[currentTutorialStep]?.description}
              </Text>
            </View>

            <View style={[{ flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: SPACING.lg,
              borderTopWidth: 1,
              borderTopColor: withAlpha(colors.accent, 'hairline'),
            }]}>
              <SettingsButton
                variant="outline"
                label={t('settings.tutorial.previous')}
                onPress={previousTutorialStep}
                disabled={currentTutorialStep === 0}
              />
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                {currentTutorialStep + 1} / {tutorialSteps.length}
              </Text>
              <SettingsButton
                variant="primary"
                label={currentTutorialStep === tutorialSteps.length - 1
                  ? t('settings.tutorial.finish')
                  : t('settings.tutorial.next')}
                onPress={currentTutorialStep === tutorialSteps.length - 1 ? closeTutorial : nextTutorialStep}
              />
            </View>

            <Pressable
              onPress={closeTutorial}
              style={[{ position: 'absolute', top: SPACING.sm, ...(Platform.OS === 'web' && isRTL ? { left: SPACING.sm } : { right: SPACING.sm }), padding: SPACING.sm }, webCursor]}
            >
              <Feather name="x" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
