import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudio } from '../../../common/utils/Sounds';
import { useColors, useTheme } from '../../../core/theme/Colors';
import { textStyles } from '../../../core/theme/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import CustomHeader from '../../../common/components/CHeader';
import { setLanguage } from '../../../core/i18n/i18n';
import { t, getDirectionalMixedSpacing, getRTLTextAlign, isRTL } from '../../../core/i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather } from '@expo/vector-icons';
import Azkar from '../../azkar/constants/Azkar';
import vibrationManager, { VIBRATION_TYPES, VIBRATION_INTENSITY } from '../../../common/utils/Vibration';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';

export default function SettingsScreen({ navigation }) {
  const colors = useColors();
  const { theme, setTheme, themes } = useTheme();
  const { volume, setClickVolume, playClick } = useAudio();
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
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isThemeDropdownVisible, setThemeDropdownVisible] = useState(false);
  const [isViewModeDropdownVisible, setViewModeDropdownVisible] = useState(false);
  const [isTasbihVibrationDropdownVisible, setTasbihVibrationDropdownVisible] = useState(false);
  const [isAzkarVibrationDropdownVisible, setAzkarVibrationDropdownVisible] = useState(false);
  const [isIntensityDropdownVisible, setIntensityDropdownVisible] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);
  const [tempTasbihVibration, setTempTasbihVibration] = useState(false);
  const [tempAzkarVibration, setTempAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [tempVibrationIntensity, setTempVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [tasbihVibration, setTasbihVibration] = useState(false);
  const [azkarVibration, setAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [vibrationIntensity, setVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  // Initial values for change detection
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

  // Add refs to track active slider operations
  const volumeSaveTimeoutRef = useRef(null);
  const fontSizeSaveTimeoutRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const scrollViewRef = useRef(null);

  // Tutorial animation values (keeping for progress bar)
  const tutorialProgress = useSharedValue(0);

  const screens = [
    { id: 'All', labelEn: 'All Azkar', labelAr: 'كل الاذكار', route: 'Home' },
    { id: 'Fav', labelEn: 'Favorites', labelAr: 'الاذكار المفضلة', route: 'Fav' },
    { id: 'Tasbih', labelEn: 'Tasbih Counter', labelAr: 'المسبحة', route: 'Screen3' },
    { id: 'PrayerTimes', labelEn: 'Prayer Times', labelAr: 'مواقيت الصلاة', route: 'PrayerTimesScreen' },
    { id: 'Qibla', labelEn: 'Qibla Direction', labelAr: 'اتجاه القبلة', route: 'QiblaScreen' },
  ];

  const viewModes = [
    { id: 'swiper', labelEn: 'Swiper (Page by Page)', labelAr: 'التمرير (صفحة بصفحة)' },
    { id: 'onePageScroll', labelEn: 'One Page Scroll', labelAr: 'التمرير المستمر' },
  ];

  const vibrationOptions = [
    { id: VIBRATION_TYPES.OFF, labelEn: 'Off', labelAr: 'إيقاف' },
    { id: VIBRATION_TYPES.ON_NEXT, labelEn: 'Only when moving to next zikr', labelAr: 'فقط عند الانتقال للذكر التالي' },
    { id: VIBRATION_TYPES.ON_EVERY, labelEn: 'On every zikr count', labelAr: 'عند كل عدة ذكر' },
  ];

  const tasbihVibrationOptions = [
    { id: false, labelEn: 'Off', labelAr: 'إيقاف' },
    { id: true, labelEn: 'On', labelAr: 'تشغيل' },
  ];

  const intensityOptions = [
    { id: VIBRATION_INTENSITY.LIGHT, labelEn: 'Light', labelAr: 'خفيف' },
    { id: VIBRATION_INTENSITY.MEDIUM, labelEn: 'Medium', labelAr: 'متوسط' },
    { id: VIBRATION_INTENSITY.HEAVY, labelEn: 'Heavy', labelAr: 'قوي' },
  ];

  const tutorialSteps = useMemo(() => [
    { key: 'language', title: t('settings.language'), description: t('settings.tutorial.language') },
    { key: 'autoSave', title: t('settings.autoSave'), description: t('settings.tutorial.autoSave') },
    { key: 'theme', title: t('settings.theme'), description: t('settings.tutorial.theme') },
    { key: 'initialScreen', title: t('settings.initialScreen'), description: t('settings.tutorial.initialScreen') },
    { key: 'viewMode', title: t('settings.viewMode'), description: t('settings.tutorial.viewMode') },
    ...(vibrationSupported && Platform.OS !== 'web' ? [
      { key: 'vibrationTasbih', title: t('settings.vibrationTasbih'), description: t('settings.tutorial.vibrationTasbih') },
      { key: 'vibrationAzkar', title: t('settings.vibrationAzkar'), description: t('settings.tutorial.vibrationAzkar') },
      { key: 'vibrationIntensity', title: t('settings.vibrationIntensity'), description: t('settings.tutorial.vibrationIntensity') }
    ] : []),
    { key: 'clickVolume', title: t('settings.clickVolume'), description: t('settings.tutorial.clickVolume') },
    { key: 'fontSize', title: t('settings.fontSize'), description: t('settings.tutorial.fontSize') },
  ], [vibrationSupported]);

  // Scroll positions for each setting (approximate Y positions)
  const settingScrollPositions = {
    language: 0,
    autoSave: 80,
    theme: 180,
    initialScreen: 380,
    viewMode: 500,
    vibrationTasbih: 620,
    vibrationAzkar: 800,
    vibrationIntensity: 900,
    clickVolume: Platform.OS !== 'web' ? 1160 : 680,
    fontSize: Platform.OS !== 'web' ? 1460 : 1000,
  };

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    container: {
      flex: 1,
      ...(Platform.OS === 'web' && {
        maxHeight: 'calc(100vh - 64px)', // Subtract header height
      }),
    },
    containerLifted: {
      ...(Platform.OS === 'web' && {
        // maxHeight: 'calc(55vh - 64px)', // Lift up more to show tutorial panel
      }),
    },
    scrollContent: {
      padding: 20,
      ...(Platform.OS === 'web' && {
        paddingBottom: 100
      }),
      paddingBottom: 100, // Add padding for floating button
    },
    buttonSetting: {
      paddingVertical: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    dropdown: {
      width: '90%',
      maxHeight: 200,
      backgroundColor: colors.DGreen,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: colors.BYellow,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      marginBottom: 0,
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.BYellow + '60',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    dropdownItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.BYellow + '33',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeDropdownItem: {
      backgroundColor: colors.BYellow,
    },
    dropdownText: {
      ...textStyles.body,
      color: colors.BYellow,
      textAlign: 'center',
    },
    activeDropdownText: {
      color: colors.DGreen,
      fontWeight: 'bold',
    },
    dropdownTrigger: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.MGreen,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.BYellow,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dropdownTriggerText: {
      ...textStyles.body,
      color: colors.BYellow,
      fontWeight: 'bold',
      flex: 1,
      ...getDirectionalMixedSpacing({ marginRight: 10 }),
    },
    setting: {
      marginBottom: 20,
      backgroundColor: colors.MGreen,
      padding: 15,
      borderRadius: 10,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    buttonContainerFullWidth: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 120,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    buttonFullWidth: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    langButton: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 8,
      minWidth: 120,
      backgroundColor: colors.MGreen,
      borderWidth: 1,
      borderColor: colors.BYellow,
    },
    activeLangButton: {
      backgroundColor: colors.BYellow,
    },
    langButtonText: {
      ...textStyles.body,
      color: colors.BYellow,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    activeLangButtonText: {
      color: colors.DGreen,
    },
    settingTitle: {
      ...textStyles.body,
      fontWeight: 'bold',
      marginBottom: 10,
      color: colors.BYellow,
    },
    autoSaveContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 5,
    },
    autoSaveText: {
      ...textStyles.body,
      color: colors.BYellow,
      flex: 1,
      ...getDirectionalMixedSpacing({ marginRight: 15 }),
    },
    autoSaveDescription: {
      ...textStyles.body,
      color: colors.BYellow,
      fontSize: 12,
      opacity: 0.8,
      marginTop: 5,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleButton: {
      width: 50,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    toggleButtonActive: {
      backgroundColor: colors.BYellow,
    },
    toggleButtonInactive: {
      backgroundColor: colors.DGreen,
      borderWidth: 1,
      borderColor: colors.BYellow + '50',
    },
    toggleCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.DGreen,
    },
    toggleCircleActive: {
      backgroundColor: colors.DGreen,
      alignSelf: 'flex-end',
    },
    toggleCircleInactive: {
      backgroundColor: colors.BYellow,
      alignSelf: 'flex-start',
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderRTL: {
      width: '100%',
      height: 40,
      ...(Platform.OS === 'web' && {
        transform: 'scaleX(-1)',
      }),
    },
    volumeText: {
      textAlign: 'center',
      marginTop: 5,
      color: colors.BYellow,
    },
    fontSizeText: {
      textAlign: 'center',
      marginTop: 5,
      color: colors.BYellow,
    },
    previewContainer: {
      marginTop: 15,
      padding: 15,
      backgroundColor: colors.DGreen,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.BYellow + '33',
    },
    previewLabel: {
      ...textStyles.body,
      color: colors.BYellow,
      textAlign: 'center',
      marginBottom: 10,
      fontSize: 14,
      opacity: 0.8,
    },
    previewText: {
      color: colors.BYellow,
      textAlign: getRTLTextAlign('left'),
      ...textStyles.base
    },
    buttonText: {
      ...textStyles.body,
      color: colors.DGreen,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    tutorialButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.MGreen,
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    tutorialButtonText: {
      ...textStyles.body,
      color: colors.BYellow,
      fontWeight: 'bold',
      ...getDirectionalMixedSpacing({ marginRight: 10 }),
    },
    tutorialHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.BYellow,
      borderRadius: 10,
      zIndex: -1,
    },
    tutorialHighlightActive: {
      opacity: 0.8,
      transform: [{ scale: 1.05 }],
    },
    tutorialPanel: {
      position: 'absolute',
      bottom: 100,
      left: 5,
      right: 5,
      backgroundColor: colors.DGreen,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
      maxHeight: '40%',
      zIndex: 999, // Lower z-index to avoid interfering with navigation
    },
    tutorialContent: {
      flex: 1,
      backgroundColor: colors.DGreen,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.BYellow,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    tutorialHeader: {
      padding: 20,
      backgroundColor: colors.MGreen,
      borderBottomWidth: 1,
      borderBottomColor: colors.BYellow,
    },
    tutorialTitle: {
      ...textStyles.body,
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.BYellow,
      textAlign: 'center',
    },
    tutorialProgress: {
      height: 4,
      backgroundColor: colors.DGreen,
      marginTop: 10,
    },
    tutorialProgressFill: {
      height: '100%',
      backgroundColor: colors.BYellow,
      borderRadius: 2,
    },
    tutorialBody: {
      padding: 20,
      minHeight: 50,
    },
    tutorialStepTitle: {
      ...textStyles.body,
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.BYellow,
      marginBottom: 10,
      textAlign: getRTLTextAlign('left'),
    },
    tutorialStepDescription: {
      ...textStyles.body,
      color: colors.BYellow,
      lineHeight: 22,
      textAlign: getRTLTextAlign('left'),
    },
    tutorialNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.MGreen,
      borderTopWidth: 1,
      borderTopColor: colors.BYellow,
    },
    tutorialButtonNav: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.BYellow,
      minWidth: 80,
    },
    tutorialButtonNavText: {
      ...textStyles.body,
      color: colors.DGreen,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tutorialButtonNavDisabled: {
      backgroundColor: colors.DGreen,
      opacity: 0.5,
    },
    tutorialStepIndicator: {
      ...textStyles.body,
      color: colors.BYellow,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  // Animated styles for tutorial highlighting (removed - using simple state now)
  // const animatedHighlightStyle = useAnimatedStyle(() => ({
  //   opacity: highlightOpacity.value,
  //   transform: [{ scale: highlightScale.value }],
  // }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${((currentTutorialStep + 1) / tutorialSteps.length) * 100}%`,
  }));

  useEffect(() => {
    // Update progress bar animation
    tutorialProgress.value = withTiming((currentTutorialStep + 1) / tutorialSteps.length, { duration: 300 });
  }, [currentTutorialStep]);

  useEffect(() => {
    // Start animation when tutorial step changes
    if (isTutorialVisible && !isAnimating && currentTutorialStep < tutorialSteps.length) {
      const timer = setTimeout(() => {
        startTutorialAnimation();
      }, 500); // Small delay to allow modal to render
      return () => clearTimeout(timer);
    }
  }, [currentTutorialStep, isTutorialVisible]);

  useEffect(() => {
    // Load current language and initial screen on mount
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

        // Set temp theme to current theme
        setTempTheme(theme);

        // Load font size
        const defaultFontSize = 18;
        const currentFontSize = storedFontSize ? parseInt(storedFontSize) : defaultFontSize;
        setFontSize(currentFontSize);
        setTempFontSize(currentFontSize);
        setLastSavedFontSize(currentFontSize);

        // Load view mode
        const defaultViewMode = 'swiper';
        const currentViewMode = storedViewMode || defaultViewMode;
        setViewMode(currentViewMode);
        setTempViewMode(currentViewMode);
        setLastSavedViewMode(currentViewMode);

        // Load auto save setting (default to true)
        const currentAutoSave = storedAutoSave !== null ? storedAutoSave === 'true' : true;
        setAutoSave(currentAutoSave);

        // Load vibration settings
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

        // Check if vibration is supported
        const supported = await vibrationManager.isVibrationSupported();
        setVibrationSupported(supported);

        // If no screen is set, set default to 'Fav' and save it
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

        // Check if it's first time
        if (firstTime === null) {
          setIsFirstTime(true);
          // Prevent going back
          navigation.setOptions({
            headerLeft: () => null,
            gestureEnabled: false
          });
        } else {
          setIsFirstTime(false);
        }
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [volume, theme, tempTheme, isFirstTime, navigation]);

  // Cleanup timeouts on unmount
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

  // Handle back button press in header
  const handleBackPress = async () => {
    if (isFirstTime) {
      await AsyncStorage.setItem('@firstTimeSettings', 'visited');
      setIsFirstTime(false);
      // Re-enable back navigation
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
      // Clear any existing timeout
      if (volumeSaveTimeoutRef.current) {
        clearTimeout(volumeSaveTimeoutRef.current);
      }

      // Debounce the save operation
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
    const newValue = Math.round(value);
    setTempFontSize(newValue);
  };

  const handleFontSizeChangeComplete = async (value) => {
    isUserInteractingRef.current = false;
    const newValue = Math.round(value);

    if (autoSave) {
      // Clear any existing timeout
      if (fontSizeSaveTimeoutRef.current) {
        clearTimeout(fontSizeSaveTimeoutRef.current);
      }

      // Debounce the save operation
      fontSizeSaveTimeoutRef.current = setTimeout(async () => {
        if (!isUserInteractingRef.current) {
          await AsyncStorage.setItem('@fontSize', newValue.toString());
          setFontSize(newValue);
          setLastSavedFontSize(newValue);
        }
      }, 100);
    }
  };

  const handleAutoSave = async () => {
    if (!autoSave) return;

    // Save volume if changed
    if (tempVolume !== volume) {
      setClickVolume(tempVolume);
      setLastSavedVolume(tempVolume);
    }

    // Save theme if changed
    if (tempTheme !== theme) {
      await setTheme(tempTheme);
    }

    // Save font size if changed
    if (tempFontSize !== fontSize) {
      await AsyncStorage.setItem('@fontSize', tempFontSize.toString());
      setFontSize(tempFontSize);
      setLastSavedFontSize(tempFontSize);
    }

    // Save view mode if changed
    if (tempViewMode !== viewMode) {
      await AsyncStorage.setItem('@viewMode', tempViewMode);
      setViewMode(tempViewMode);
      setLastSavedViewMode(tempViewMode);
    }

    // Save vibration settings if changed
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

    // Save initial screen if changed
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

    // Apply and save theme immediately when default is clicked
    await setTheme('originalGreen');
    await handleLanguageChange('ar');

    // If auto save is enabled, apply all default settings immediately
    if (autoSave) {
      // Apply volume
      setClickVolume(0.9);
      setLastSavedVolume(0.9);

      // Apply font size
      await AsyncStorage.setItem('@fontSize', '18');
      setFontSize(18);
      setLastSavedFontSize(18);

      // Apply initial screen
      await AsyncStorage.setItem('@initialScreen', 'Fav');
      setInitialScreen('Fav');
      setLastSavedScreen('Fav');

      // Apply view mode
      await AsyncStorage.setItem('@viewMode', 'swiper');
      setViewMode('swiper');
      setLastSavedViewMode('swiper');

      // Apply vibration settings
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

    // If it's first time, mark settings as visited
    if (isFirstTime) {
      await AsyncStorage.setItem('@firstTimeSettings', 'visited');
      setIsFirstTime(false);
      // Re-enable back navigation
      navigation.setOptions({
        headerLeft: undefined,
        gestureEnabled: true
      });
    }

    // Always save all settings when manually saving
    await handleAutoSave();

    // If language was changed, restart the app
    if (languageChanged) {
      await setLanguage(currentLang, true); // Restart app
      return; // Don't continue with other saves since we're restarting
    }

    // Navigate appropriately
    if (tempScreen !== initialScreen) {
      const selectedScreen = screens.find(s => s.id === tempScreen);
      if (selectedScreen) {
        navigation.navigate(selectedScreen.route);
      }
    } else {
      navigation.goBack();
    }
  };

  const handleLanguageChange = async (lang) => {
    if (lang !== currentLang) {
      playClick(); // Use stored volume setting
      await setLanguage(lang, false); // Don't restart app immediately
      setCurrentLang(lang);
      setInitialLang(lang);
      setLanguageChanged(true); // Mark that language has changed
    }
  };

  const handleScreenChange = (screen) => {
    playClick();
    setTempScreen(screen);
    setDropdownVisible(false);
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
    // Apply theme immediately
    await setTheme(themeKey);
    setThemeDropdownVisible(false);
  };

  const handleViewModeChange = (mode) => {
    playClick();
    setTempViewMode(mode);
    setViewModeDropdownVisible(false);
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
    setTasbihVibrationDropdownVisible(false);
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
    setAzkarVibrationDropdownVisible(false);
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
    setTempVibrationIntensity(intensity);
    setIntensityDropdownVisible(false);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setVibrationIntensity(intensity);
        setVibrationIntensity(intensity);
        setLastSavedVibrationIntensity(intensity);
      }, 100);
    }
  };

  // Check for unsaved changes
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

  // Function to scroll to a specific setting
  const scrollToSetting = (settingKey) => {
    if (isTutorialVisible && scrollViewRef.current && settingScrollPositions[settingKey] !== undefined) {
      const yPosition = settingScrollPositions[settingKey];
      console.log(`Scrolling to setting: ${settingKey} at position: ${yPosition}`);

      scrollViewRef.current.scrollTo({
        y: yPosition,
        animated: true,
      });
    }
  };

  // Tutorial functions
  const startTutorialAnimation = () => {
    try {
      // Safety check: don't start animation if tutorial is not visible or step is out of bounds
      if (!isTutorialVisible || currentTutorialStep >= tutorialSteps.length) {
        console.log('Not starting tutorial animation - tutorial not visible or step out of bounds');
        return;
      }

      const currentStepKey = tutorialSteps[currentTutorialStep]?.key;
      console.log(`Starting tutorial animation for step ${currentTutorialStep} (${currentStepKey})`);

      setIsAnimating(true);
      setHighlightVisible(true); // Show highlight

      // Simple timeout for highlighting
      setTimeout(() => {
        try {
          console.log(`Tutorial timeout finished for step ${currentTutorialStep}`);
          setHighlightVisible(false); // Hide highlight
          setIsAnimating(false);
        } catch (error) {
          console.error('Error in timeout callback:', error);
          setIsAnimating(false);
          setHighlightVisible(false);
        }
      }, 500);

    } catch (error) {
      console.error('Error in startTutorialAnimation:', error);
      // Reset animation state on error
      setIsAnimating(false);
      setHighlightVisible(false);
    }
  };

  const nextTutorialStep = () => {
    if (isTutorialVisible && currentTutorialStep < tutorialSteps.length - 1) {
      const nextStep = currentTutorialStep + 1;
      console.log(`Advancing to tutorial step ${nextStep}`);
      setCurrentTutorialStep(nextStep);

      // Scroll to the next setting
      const nextStepKey = tutorialSteps[nextStep]?.key;
      if (nextStepKey) {
        setTimeout(() => scrollToSetting(nextStepKey), 100);
      }
    } else {
      // If we're at the last step, don't try to advance further
      console.log('Tutorial reached last step - not advancing');
    }
  };

  const previousTutorialStep = () => {
    if (currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1;
      console.log(`Going back to tutorial step ${prevStep}`);
      setCurrentTutorialStep(prevStep);

      // Scroll to the previous setting
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
    console.log('Closing tutorial');
    setTutorialVisible(false);
    setCurrentTutorialStep(0);
    setIsAnimating(false);
    setHighlightVisible(false);
    // highlightOpacity.value = 0;
    // highlightScale.value = 1;
    tutorialProgress.value = 0;

    // Scroll to top when tutorial finishes
    if (scrollViewRef.current) {
      try {
        if (Platform.OS === 'web') {
          // For web, try multiple approaches
          const scrollElement = scrollViewRef.current.getScrollableNode
            ? scrollViewRef.current.getScrollableNode()
            : scrollViewRef.current;

          if (scrollElement && scrollElement.scrollTo) {
            scrollElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          } else if (scrollElement && scrollElement.scrollTop !== undefined) {
            scrollElement.scrollTop = 0;
          }
        } else {
          // For mobile, use the standard approach
          scrollViewRef.current.scrollTo({
            y: 0,
            animated: true,
          });
        }
      } catch (error) {
        console.warn('Error scrolling to top:', error);
      }
    }
  };

  return (
    <View style={styles.wrapper} testID="settings-screen">
      <CustomHeader
        title={t("navigation.settings")}
        navigation={navigation}
        Right={isFirstTime && !autoSave ? () => (<View style={{ flex: 1 }} />) : false}
        onBackPress={handleBackPress}
      />
      <LinearGradient
        colors={[colors.BGreen, colors.DGreen]}
        style={[styles.container, isTutorialVisible && styles.containerLifted]}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={Platform.OS === 'web' ? { flex: 1 } : undefined}
        >

          <TouchableOpacity
            style={styles.tutorialButton}
            onPress={openTutorial}
          >
            <Text style={styles.tutorialButtonText}>{t('settings.tutorial.help')}</Text>
            <AntDesign name="questioncircleo" size={20} color={colors.BYellow} />
          </TouchableOpacity>

          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'language' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.language')}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                testID="language-toggle"
                style={[
                  styles.langButton,
                  currentLang === 'en' && styles.activeLangButton
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={[
                  styles.langButtonText,
                  currentLang === 'en' && styles.activeLangButtonText
                ]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  currentLang === 'ar' && styles.activeLangButton
                ]}
                onPress={() => handleLanguageChange('ar')}
              >
                <Text style={[
                  styles.langButtonText,
                  currentLang === 'ar' && styles.activeLangButtonText
                ]}>العربية</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto Save Setting */}
          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'autoSave' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.autoSave')}</Text>
            <View style={styles.autoSaveContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.autoSaveDescription}>{t('settings.autoSaveDescription')}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  autoSave ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={handleAutoSaveToggle}
              >
                <View style={[
                  styles.toggleCircle,
                  autoSave ? styles.toggleCircleActive : styles.toggleCircleInactive
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme Selection */}
          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'theme' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.theme')}</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                playClick();
                setThemeDropdownVisible(true);
              }}
            >
              <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                {currentLang === 'ar' ? themes[tempTheme]?.nameAr : themes[tempTheme]?.name || 'Original Green'}
              </Text>
              <AntDesign name={isThemeDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
            </TouchableOpacity>
          </View>

          {/* Theme Dropdown Modal */}
          <Modal
            visible={isThemeDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setThemeDropdownVisible(false)}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={1}
              onPress={() => setThemeDropdownVisible(false)}
            >
              <View style={{
                width: '85%',
                maxHeight: '70%',
                backgroundColor: colors.DGreen,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.BYellow,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}>
                <View style={{
                  backgroundColor: colors.BGreen,
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.BYellow + '33',
                }}>
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: 18,
                    fontFamily: "Cairo_400Regular",
                    textAlign: 'center',
                  }}>{t('settings.theme')}</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                  {Object.entries(themes).map(([themeKey, themeData]) => (
                    <TouchableOpacity
                      key={themeKey}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.BYellow + '20',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: tempTheme === themeKey ? colors.BYellow : 'transparent',
                      }}
                      onPress={() => handleThemeChange(themeKey)}
                    >
                      <Text style={{
                        color: tempTheme === themeKey ? colors.DGreen : colors.BYellow,
                        fontSize: 16,
                        fontFamily: "Cairo_400Regular",
                        textAlign: 'center',
                        flex: 1,
                        fontWeight: tempTheme === themeKey ? 'bold' : 'normal',
                      }}>{currentLang === 'ar' ? themeData.nameAr : themeData.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* View Mode Dropdown Modal */}
          <Modal
            visible={isViewModeDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setViewModeDropdownVisible(false)}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={1}
              onPress={() => setViewModeDropdownVisible(false)}
            >
              <View style={{
                width: '85%',
                maxHeight: '70%',
                backgroundColor: colors.DGreen,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.BYellow,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}>
                <View style={{
                  backgroundColor: colors.BGreen,
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.BYellow + '33',
                }}>
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: 18,
                    fontFamily: "Cairo_400Regular",
                    textAlign: 'center',
                  }}>{t('settings.viewMode')}</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                  {viewModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.BYellow + '20',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: tempViewMode === mode.id ? colors.BYellow : 'transparent',
                      }}
                      onPress={() => handleViewModeChange(mode.id)}
                    >
                      <Text style={{
                        color: tempViewMode === mode.id ? colors.DGreen : colors.BYellow,
                        fontSize: 16,
                        fontFamily: "Cairo_400Regular",
                        textAlign: 'center',
                        flex: 1,
                        fontWeight: tempViewMode === mode.id ? 'bold' : 'normal',
                      }}>{currentLang === 'ar' ? mode.labelAr : mode.labelEn}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Tasbih Vibration Dropdown Modal - Mobile Only */}
          {vibrationSupported && Platform.OS !== 'web' && (
            <Modal
              visible={isTasbihVibrationDropdownVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setTasbihVibrationDropdownVisible(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={1}
                onPress={() => setTasbihVibrationDropdownVisible(false)}
              >
                <View style={{
                  width: '85%',
                  maxHeight: '70%',
                  backgroundColor: colors.DGreen,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.BYellow,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4.65,
                  elevation: 8,
                }}>
                  <View style={{
                    backgroundColor: colors.BGreen,
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.BYellow + '33',
                  }}>
                    <Text style={{
                      color: colors.BYellow,
                      fontSize: 18,
                      fontFamily: "Cairo_400Regular",
                      textAlign: 'center',
                    }}>{t('settings.vibrationTasbih')}</Text>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                    {tasbihVibrationOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id.toString()}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BYellow + '20',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: tempTasbihVibration === option.id ? colors.BYellow : 'transparent',
                        }}
                        onPress={() => handleTasbihVibrationChange(option.id)}
                      >
                        <Text style={{
                          color: tempTasbihVibration === option.id ? colors.DGreen : colors.BYellow,
                          fontSize: 16,
                          fontFamily: "Cairo_400Regular",
                          textAlign: 'center',
                          flex: 1,
                          fontWeight: tempTasbihVibration === option.id ? 'bold' : 'normal',
                        }}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Azkar Vibration Dropdown Modal - Mobile Only */}
          {vibrationSupported && Platform.OS !== 'web' && (
            <Modal
              visible={isAzkarVibrationDropdownVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setAzkarVibrationDropdownVisible(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={1}
                onPress={() => setAzkarVibrationDropdownVisible(false)}
              >
                <View style={{
                  width: '85%',
                  maxHeight: '70%',
                  backgroundColor: colors.DGreen,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.BYellow,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4.65,
                  elevation: 8,
                }}>
                  <View style={{
                    backgroundColor: colors.BGreen,
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.BYellow + '33',
                  }}>
                    <Text style={{
                      color: colors.BYellow,
                      fontSize: 18,
                      fontFamily: "Cairo_400Regular",
                      textAlign: 'center',
                    }}>{t('settings.vibrationAzkar')}</Text>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                    {vibrationOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BYellow + '20',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: tempAzkarVibration === option.id ? colors.BYellow : 'transparent',
                        }}
                        onPress={() => handleAzkarVibrationChange(option.id)}
                      >
                        <Text style={{
                          color: tempAzkarVibration === option.id ? colors.DGreen : colors.BYellow,
                          fontSize: 16,
                          fontFamily: "Cairo_400Regular",
                          textAlign: 'center',
                          flex: 1,
                          fontWeight: tempAzkarVibration === option.id ? 'bold' : 'normal',
                        }}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Vibration Intensity Dropdown Modal - Mobile Only */}
          {vibrationSupported && Platform.OS !== 'web' && (
            <Modal
              visible={isIntensityDropdownVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIntensityDropdownVisible(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={1}
                onPress={() => setIntensityDropdownVisible(false)}
              >
                <View style={{
                  width: '85%',
                  maxHeight: '70%',
                  backgroundColor: colors.DGreen,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.BYellow,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4.65,
                  elevation: 8,
                }}>
                  <View style={{
                    backgroundColor: colors.BGreen,
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.BYellow + '33',
                  }}>
                    <Text style={{
                      color: colors.BYellow,
                      fontSize: 18,
                      fontFamily: "Cairo_400Regular",
                      textAlign: 'center',
                    }}>{t('settings.vibrationIntensity')}</Text>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                    {intensityOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BYellow + '20',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: tempVibrationIntensity === option.id ? colors.BYellow : 'transparent',
                        }}
                        onPress={() => handleIntensityChange(option.id)}
                      >
                        <Text style={{
                          color: tempVibrationIntensity === option.id ? colors.DGreen : colors.BYellow,
                          fontSize: 16,
                          fontFamily: "Cairo_400Regular",
                          textAlign: 'center',
                          flex: 1,
                          fontWeight: tempVibrationIntensity === option.id ? 'bold' : 'normal',
                        }}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          <Modal
            visible={isDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={1}
              onPress={() => setDropdownVisible(false)}
            >
              <View style={{
                width: '85%',
                maxHeight: '70%',
                backgroundColor: colors.DGreen,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.BYellow,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}>
                <View style={{
                  backgroundColor: colors.BGreen,
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.BYellow + '33',
                }}>
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: 18,
                    fontFamily: "Cairo_400Regular",
                    textAlign: 'center',
                  }}>{t('settings.initialScreen')}</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}>
                  {screens.map((screen) => (
                    <TouchableOpacity
                      key={screen.id}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.BYellow + '20',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: tempScreen === screen.id ? colors.BYellow : 'transparent',
                      }}
                      onPress={() => handleScreenChange(screen.id)}
                    >
                      <Text style={{
                        color: tempScreen === screen.id ? colors.DGreen : colors.BYellow,
                        fontSize: 16,
                        fontFamily: "Cairo_400Regular",
                        textAlign: 'center',
                        flex: 1,
                        fontWeight: tempScreen === screen.id ? 'bold' : 'normal',
                      }}>{currentLang === 'ar' ? screen.labelAr : screen.labelEn}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'initialScreen' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.initialScreen')}</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                playClick();
                setDropdownVisible(true);
              }}
            >
              <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                {screens.find(s => s.id === tempScreen)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || t('settings.selectScreen')}
              </Text>
              <AntDesign name={isDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
            </TouchableOpacity>
          </View>

          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'viewMode' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.viewMode')}</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                playClick();
                setViewModeDropdownVisible(true);
              }}
            >
              <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                {viewModes.find(s => s.id === tempViewMode)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || t('settings.selectViewMode')}
              </Text>
              <AntDesign name={isViewModeDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
            </TouchableOpacity>
          </View>

          {/* Vibration Settings - Mobile Only */}
          {vibrationSupported && Platform.OS !== 'web' && (
            <>
              <View style={styles.setting}>
                <View
                  style={[
                    styles.tutorialHighlight,
                    tutorialSteps[currentTutorialStep]?.key === 'vibrationTasbih' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
                  ]}
                />
                <Text style={styles.settingTitle}>{t('settings.vibrationTasbih')}</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    playClick();
                    setTasbihVibrationDropdownVisible(true);
                  }}
                >
                  <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                    {tasbihVibrationOptions.find(s => s.id === tempTasbihVibration)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || t('settings.selectVibration')}
                  </Text>
                  <AntDesign name={isTasbihVibrationDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
                </TouchableOpacity>
              </View>

              <View style={styles.setting}>
                <View
                  style={[
                    styles.tutorialHighlight,
                    tutorialSteps[currentTutorialStep]?.key === 'vibrationAzkar' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
                  ]}
                />
                <Text style={styles.settingTitle}>{t('settings.vibrationAzkar')}</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    playClick();
                    setAzkarVibrationDropdownVisible(true);
                  }}
                >
                  <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                    {vibrationOptions.find(s => s.id === tempAzkarVibration)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || t('settings.selectVibration')}
                  </Text>
                  <AntDesign name={isAzkarVibrationDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
                </TouchableOpacity>
              </View>

              <View style={styles.setting}>
                <View
                  style={[
                    styles.tutorialHighlight,
                    tutorialSteps[currentTutorialStep]?.key === 'vibrationIntensity' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
                  ]}
                />
                <Text style={styles.settingTitle}>{t('settings.vibrationIntensity')}</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    playClick();
                    setIntensityDropdownVisible(true);
                  }}
                >
                  <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
                    {intensityOptions.find(s => s.id === tempVibrationIntensity)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || t('settings.selectIntensity')}
                  </Text>
                  <AntDesign name={isIntensityDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'clickVolume' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.clickVolume')}</Text>
            <Slider
              style={Platform.OS === 'web' && isRTL() ? styles.sliderRTL : styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={tempVolume}
              onValueChange={handleVolumeChange}
              onSlidingComplete={handleVolumeChangeComplete}
              minimumTrackTintColor={colors.BYellow}
              maximumTrackTintColor={colors.DYellow}
              thumbTintColor={colors.BYellow}
            />
            <Text style={styles.volumeText}>{Math.round(tempVolume * 100)}%</Text>
          </View>

          <View style={styles.setting}>
            <View
              style={[
                styles.tutorialHighlight,
                tutorialSteps[currentTutorialStep]?.key === 'fontSize' && isTutorialVisible && highlightVisible ? styles.tutorialHighlightActive : { opacity: 0 }
              ]}
            />
            <Text style={styles.settingTitle}>{t('settings.fontSize')}</Text>
            <Slider
              style={Platform.OS === 'web' && isRTL() ? styles.sliderRTL : styles.slider}
              minimumValue={12}
              maximumValue={28}
              value={tempFontSize}
              onValueChange={handleFontSizeChange}
              onSlidingComplete={handleFontSizeChangeComplete}
              minimumTrackTintColor={colors.BYellow}
              maximumTrackTintColor={colors.DYellow}
              thumbTintColor={colors.BYellow}
              step={1}
            />
            <Text style={styles.fontSizeText}>{tempFontSize}px</Text>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>
                {t('settings.preview')}
              </Text>
              <Text style={[styles.previewText, { fontSize: tempFontSize }]}>
                {Azkar && Azkar.length > 0 ? Azkar[0].zekr : 'الحمد لله وحده، والصلاة والسلام على من لا نبي بعده'}
              </Text>
            </View>
          </View>
          {isTutorialVisible && (<View style={{ height: 340 }} />)}
        </ScrollView>

        {/* Floating Save Button - only show when auto save is disabled */}
        {!autoSave && (
          <TouchableOpacity
            onPress={handleSave}
            style={{
              position: Platform.OS === 'web' ? 'fixed' : 'absolute',
              bottom: Platform.OS === 'web' ? 20 : 30,
              ...getDirectionalMixedSpacing({ right: 20 }),
              backgroundColor: colors.BYellow,
              borderRadius: 28,
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              zIndex: 1000,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              })
            }}
          >
            <Feather name="save" size={24} color={colors.DGreen} />
          </TouchableOpacity>
        )}

        {/* Floating Default Button - only show when auto save is disabled */}
        {!autoSave && (
          <TouchableOpacity
            onPress={handleDefault}
            style={{
              position: Platform.OS === 'web' ? 'fixed' : 'absolute',
              bottom: Platform.OS === 'web' ? 20 : 30,
              ...getDirectionalMixedSpacing({ right: 90 }),
              backgroundColor: colors.DYellow,
              borderRadius: 28,
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              zIndex: 1000,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              })
            }}
          >
            <Feather name="rotate-ccw" size={24} color={colors.DGreen} />
          </TouchableOpacity>
        )}

        {/* Floating Default Button - also show when auto save is enabled */}
        {autoSave && (
          <TouchableOpacity
            onPress={handleDefault}
            style={{
              position: Platform.OS === 'web' ? 'fixed' : 'absolute',
              bottom: Platform.OS === 'web' ? 20 : 30,
              ...getDirectionalMixedSpacing({ right: 20 }),
              backgroundColor: colors.DYellow,
              borderRadius: 28,
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              zIndex: 1000,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              })
            }}
          >
            <Feather name="rotate-ccw" size={24} color={colors.DGreen} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tutorial Panel */}
      {isTutorialVisible && (
        <View style={styles.tutorialPanel}>
          <View style={styles.tutorialContent}>
            {/* Tutorial Header */}
            <View style={styles.tutorialHeader}>
              <Text style={styles.tutorialTitle}>{t('settings.tutorial.title')}</Text>
              <View style={styles.tutorialProgress}>
                <Animated.View style={[styles.tutorialProgressFill, animatedProgressStyle]} />
              </View>
            </View>

            {/* Tutorial Body */}
            <View style={styles.tutorialBody}>
              <Text style={styles.tutorialStepTitle}>
                {tutorialSteps[currentTutorialStep]?.title || 'Tutorial'}
              </Text>
              <Text style={styles.tutorialStepDescription}>
                {tutorialSteps[currentTutorialStep]?.description || 'Welcome to the settings tutorial!'}
              </Text>
            </View>

            {/* Tutorial Navigation */}
            <View style={styles.tutorialNavigation}>
              <TouchableOpacity
                style={[
                  styles.tutorialButtonNav,
                  currentTutorialStep === 0 && styles.tutorialButtonNavDisabled
                ]}
                onPress={previousTutorialStep}
                disabled={currentTutorialStep === 0}
              >
                <Text style={styles.tutorialButtonNavText}>
                  {isRTL() ? 'السابق' : 'Previous'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.tutorialStepIndicator}>
                {currentTutorialStep + 1} / {tutorialSteps.length}
              </Text>

              <TouchableOpacity
                style={[
                  styles.tutorialButtonNav
                ]}
                onPress={currentTutorialStep === tutorialSteps.length - 1 ? closeTutorial : nextTutorialStep}
                disabled={false}
              >
                <Text style={styles.tutorialButtonNavText}>
                  {currentTutorialStep === tutorialSteps.length - 1
                    ? (isRTL() ? 'إنهاء' : 'Finish')
                    : (isRTL() ? 'التالي' : 'Next')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: 10,
              }}
              onPress={closeTutorial}
            >
              <AntDesign name="close" size={24} color={colors.BYellow} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
