import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudio } from '../utils/Sounds';
import { useColors, useTheme } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import CustomHeader from '../components/CHeader';
import { setLanguage } from '../locales/i18n';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import Azkar from '../constants/Azkar';
import vibrationManager, { VIBRATION_TYPES, VIBRATION_INTENSITY } from '../utils/Vibration';

export default function SettingsScreen({ navigation }) {
  const colors = useColors();
  const { theme, setTheme, themes } = useTheme();
  const { volume, setClickVolume, playClick } = useAudio();
  const [currentLang, setCurrentLang] = useState('ar');
  const [initialScreen, setInitialScreen] = useState('Fav');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [tempScreen, setTempScreen] = useState('Fav');
  const [tempVolume, setTempVolume] = useState(0.35);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempFontSize, setTempFontSize] = useState(18);
  const [fontSize, setFontSize] = useState(18);
  const [tempViewMode, setTempViewMode] = useState('swiper');
  const [viewMode, setViewMode] = useState('swiper');
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

  const screens = [
    { id: 'All', labelEn: 'All Azkar', labelAr: 'كل الاذكار', route: 'Home' },
    { id: 'Fav', labelEn: 'Favorites', labelAr: 'الاذكار المفضلة', route: 'Fav' },
    { id: 'Tasbih', labelEn: 'Tasbih Counter', labelAr: 'المسبحة', route: 'Screen3' },
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

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    buttonSetting: {
      paddingVertical: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdown: {
      width: '80%',
      maxHeight: 300,
      backgroundColor: colors.DGreen,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BYellow,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
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
    slider: {
      width: '100%',
      height: 40,
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
  });

  useEffect(() => {
    // Load current language and initial screen on mount
    const loadSettings = async () => {
      try {
        const [lang, screen, firstTime, storedFontSize, storedViewMode] = await Promise.all([
          AsyncStorage.getItem('@language'),
          AsyncStorage.getItem('@initialScreen'),
          AsyncStorage.getItem('@firstTimeSettings'),
          AsyncStorage.getItem('@fontSize'),
          AsyncStorage.getItem('@viewMode')
        ]);
        
        if (lang) {
          setCurrentLang(lang);
        }
        
        // Set temp theme to current theme
        setTempTheme(theme);
        
        // Load font size
        const defaultFontSize = 18;
        const currentFontSize = storedFontSize ? parseInt(storedFontSize) : defaultFontSize;
        setFontSize(currentFontSize);
        setTempFontSize(currentFontSize);
        
        // Load view mode
        const defaultViewMode = 'swiper';
        const currentViewMode = storedViewMode || defaultViewMode;
        setViewMode(currentViewMode);
        setTempViewMode(currentViewMode);
        
        // Load vibration settings
        await vibrationManager.initialize();
        const currentTasbihVibration = vibrationManager.getTasbihSetting();
        const currentAzkarVibration = vibrationManager.getAzkarSetting();
        const currentIntensity = vibrationManager.getIntensity();
        setTasbihVibration(currentTasbihVibration);
        setTempTasbihVibration(currentTasbihVibration);
        setAzkarVibration(currentAzkarVibration);
        setTempAzkarVibration(currentAzkarVibration);
        setVibrationIntensity(currentIntensity);
        setTempVibrationIntensity(currentIntensity);
        
        // If no screen is set, set default to 'Fav' and save it
        if (!screen) {
          await AsyncStorage.setItem('@initialScreen', 'Fav');
          setInitialScreen('Fav');
          setTempScreen('Fav');
        } else {
          setInitialScreen(screen);
          setTempScreen(screen);
        }

        setTempVolume(volume);

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

  const handleVolumeChange = (value) => {
    setTempVolume(value);
    playClick(value);
  };

  const handleFontSizeChange = (value) => {
    setTempFontSize(Math.round(value));
  };

  const handleDefault = async () => {
    playClick();
    setTempVolume(0.35);
    setTempTheme('originalGreen');
    setTempFontSize(18);
    // Apply and save theme immediately when default is clicked
    await setTheme('originalGreen');
    await handleLanguageChange('ar');
    setTempScreen('Fav');
    setTempViewMode('swiper');
    setTempTasbihVibration(false);
    setTempAzkarVibration(VIBRATION_TYPES.OFF);
    setTempVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
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

    // Save volume if changed
    if (tempVolume !== volume) {
      setClickVolume(tempVolume);
    }

    // Save theme if changed
    if (tempTheme !== theme) {
      await setTheme(tempTheme);
    }

    // Save font size if changed
    if (tempFontSize !== fontSize) {
      await AsyncStorage.setItem('@fontSize', tempFontSize.toString());
      setFontSize(tempFontSize);
    }

    // Save view mode if changed
    if (tempViewMode !== viewMode) {
      await AsyncStorage.setItem('@viewMode', tempViewMode);
      setViewMode(tempViewMode);
    }

    // Save vibration settings if changed
    if (tempTasbihVibration !== tasbihVibration) {
      await vibrationManager.setTasbihVibration(tempTasbihVibration);
      setTasbihVibration(tempTasbihVibration);
    }

    if (tempAzkarVibration !== azkarVibration) {
      await vibrationManager.setAzkarVibration(tempAzkarVibration);
      setAzkarVibration(tempAzkarVibration);
    }

    if (tempVibrationIntensity !== vibrationIntensity) {
      await vibrationManager.setVibrationIntensity(tempVibrationIntensity);
      setVibrationIntensity(tempVibrationIntensity);
    }

    // Save initial screen if changed
    if (tempScreen !== initialScreen) {
      await AsyncStorage.setItem('@initialScreen', tempScreen);
      setInitialScreen(tempScreen);
      const selectedScreen = screens.find(s => s.id === tempScreen);
      if (selectedScreen) {
        navigation.navigate(selectedScreen.route);
      }
    }else{
      navigation.goBack();
    }

    // If language was changed, restart the app
    if (languageChanged) {
      await setLanguage(currentLang, true); // Restart app
      return; // Don't continue with other saves since we're restarting
    }

  };

  const handleLanguageChange = async (lang) => {
    if (lang !== currentLang) {
      playClick();
      await setLanguage(lang, false); // Don't restart app immediately
      setCurrentLang(lang);
      setLanguageChanged(true); // Mark that language has changed
    }
  };

  const handleScreenChange = (screen) => {
    playClick();
    setTempScreen(screen);
    setDropdownVisible(false);
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
  };

  const handleTasbihVibrationChange = (setting) => {
    playClick();
    setTempTasbihVibration(setting);
    setTasbihVibrationDropdownVisible(false);
  };

  const handleAzkarVibrationChange = (setting) => {
    playClick();
    setTempAzkarVibration(setting);
    setAzkarVibrationDropdownVisible(false);
  };

  const handleIntensityChange = (intensity) => {
    playClick();
    setTempVibrationIntensity(intensity);
    setIntensityDropdownVisible(false);
  };

  return (
    <View style={styles.wrapper} testID="settings-screen">
      <CustomHeader title={t("navigation.settings")} navigation={navigation} Right={isFirstTime?()=>(<View style={{flex:1}} />):false} />
      <LinearGradient colors={[colors.BGreen, colors.DGreen]} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.setting}>
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

        {/* Theme Selection */}
        <View style={styles.setting}>
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
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setThemeDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {Object.entries(themes).map(([themeKey, themeData]) => (
                  <TouchableOpacity
                    key={themeKey}
                    style={[
                      styles.dropdownItem,
                      tempTheme === themeKey && styles.activeDropdownItem
                    ]}
                    onPress={() => handleThemeChange(themeKey)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempTheme === themeKey && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? themeData.nameAr : themeData.name}</Text>
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
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setViewModeDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {viewModes.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.dropdownItem,
                      tempViewMode === mode.id && styles.activeDropdownItem
                    ]}
                    onPress={() => handleViewModeChange(mode.id)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempViewMode === mode.id && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? mode.labelAr : mode.labelEn}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tasbih Vibration Dropdown Modal - Mobile Only */}
        {Platform.OS !== 'web' && (
        <Modal
          visible={isTasbihVibrationDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTasbihVibrationDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setTasbihVibrationDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {tasbihVibrationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id.toString()}
                    style={[
                      styles.dropdownItem,
                      tempTasbihVibration === option.id && styles.activeDropdownItem
                    ]}
                    onPress={() => handleTasbihVibrationChange(option.id)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempTasbihVibration === option.id && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        )}

        {/* Azkar Vibration Dropdown Modal - Mobile Only */}
        {Platform.OS !== 'web' && (
        <Modal
          visible={isAzkarVibrationDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAzkarVibrationDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setAzkarVibrationDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {vibrationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.dropdownItem,
                      tempAzkarVibration === option.id && styles.activeDropdownItem
                    ]}
                    onPress={() => handleAzkarVibrationChange(option.id)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempAzkarVibration === option.id && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        )}

        {/* Vibration Intensity Dropdown Modal - Mobile Only */}
        {Platform.OS !== 'web' && (
        <Modal
          visible={isIntensityDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIntensityDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setIntensityDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {intensityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.dropdownItem,
                      tempVibrationIntensity === option.id && styles.activeDropdownItem
                    ]}
                    onPress={() => handleIntensityChange(option.id)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempVibrationIntensity === option.id && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? option.labelAr : option.labelEn}</Text>
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
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <ScrollView>
                {screens.map((screen) => (
                  <TouchableOpacity
                    key={screen.id}
                    style={[
                      styles.dropdownItem,
                      tempScreen === screen.id && styles.activeDropdownItem
                    ]}
                    onPress={() => handleScreenChange(screen.id)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      tempScreen === screen.id && styles.activeDropdownText
                    ]}>{currentLang === 'ar' ? screen.labelAr : screen.labelEn}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.initialScreen')}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => {
              playClick();
              setDropdownVisible(true);
            }}
          >
            <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
              {screens.find(s => s.id === tempScreen)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || 'Select Screen'}
            </Text>
            <AntDesign name={isDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.viewMode')}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => {
              playClick();
              setViewModeDropdownVisible(true);
            }}
          >
            <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
              {viewModes.find(s => s.id === tempViewMode)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || 'Select View Mode'}
            </Text>
            <AntDesign name={isViewModeDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>

        {/* Vibration Settings - Mobile Only */}
        {Platform.OS !== 'web' && (
        <>
        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.vibrationTasbih')}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => {
              playClick();
              setTasbihVibrationDropdownVisible(true);
            }}
          >
            <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
              {tasbihVibrationOptions.find(s => s.id === tempTasbihVibration)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || 'Select Vibration'}
            </Text>
            <AntDesign name={isTasbihVibrationDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.vibrationAzkar')}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => {
              playClick();
              setAzkarVibrationDropdownVisible(true);
            }}
          >
            <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
              {vibrationOptions.find(s => s.id === tempAzkarVibration)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || 'Select Vibration'}
            </Text>
            <AntDesign name={isAzkarVibrationDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.vibrationIntensity')}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => {
              playClick();
              setIntensityDropdownVisible(true);
            }}
          >
            <Text style={[styles.dropdownTriggerText, { textAlign: getRTLTextAlign('left') }]}>
              {intensityOptions.find(s => s.id === tempVibrationIntensity)?.[currentLang === 'ar' ? 'labelAr' : 'labelEn'] || 'Select Intensity'}
            </Text>
            <AntDesign name={isIntensityDropdownVisible ? "up" : "down"} size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>
        </>
        )}

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.clickVolume')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={tempVolume}
            onValueChange={handleVolumeChange}
            minimumTrackTintColor={colors.BYellow}
            maximumTrackTintColor={colors.DYellow}
            thumbTintColor={colors.BYellow}
          />
          <Text style={styles.volumeText}>{Math.round(tempVolume * 100)}%</Text>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>{t('settings.fontSize')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={28}
            value={tempFontSize}
            onValueChange={handleFontSizeChange}
            minimumTrackTintColor={colors.BYellow}
            maximumTrackTintColor={colors.DYellow}
            thumbTintColor={colors.BYellow}
            step={1}
          />
          <Text style={styles.fontSizeText}>{tempFontSize}px</Text>
          
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>
              {currentLang === 'ar' ? 'معاينة' : 'Preview'}
            </Text>
            <Text style={[styles.previewText, { fontSize: tempFontSize }]}>
              {Azkar && Azkar.length > 0 ? Azkar[0].zekr : 'الحمد لله وحده، والصلاة والسلام على من لا نبي بعده'}
            </Text>
          </View>
        </View>

        <View style={[styles.setting, styles.buttonSetting]}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.DYellow }]}
              onPress={handleDefault}
            >
              <Text style={styles.buttonText}>{t('settings.default')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.BYellow }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{t('settings.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
