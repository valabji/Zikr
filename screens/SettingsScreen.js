import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
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
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isThemeDropdownVisible, setThemeDropdownVisible] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);

  const screens = [
    { id: 'All', labelEn: 'All Azkar', labelAr: 'كل الاذكار', route: 'Home' },
    { id: 'Fav', labelEn: 'Favorites', labelAr: 'الاذكار المفضلة', route: 'Fav' },
    { id: 'Tasbih', labelEn: 'Tasbih Counter', labelAr: 'المسبحة', route: 'Screen3' },
  ];

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 20,
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
        const [lang, screen, firstTime] = await Promise.all([
          AsyncStorage.getItem('@language'),
          AsyncStorage.getItem('@initialScreen'),
          AsyncStorage.getItem('@firstTimeSettings')
        ]);
        
        if (lang) {
          setCurrentLang(lang);
        }
        
        // Set temp theme to current theme
        setTempTheme(theme);
        
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

  const handleDefault = async () => {
    playClick();
    setTempVolume(0.35);
    setTempTheme('originalGreen');
    // Apply and save theme immediately when default is clicked
    await setTheme('originalGreen');
    await handleLanguageChange('ar');
    setTempScreen('Fav');
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

  return (
    <View style={styles.wrapper} testID="settings-screen">
      <CustomHeader title={t("navigation.settings")} navigation={navigation} Right={isFirstTime?()=>(<View style={{flex:1}} />):false} />
      <LinearGradient colors={[colors.BGreen, colors.DGreen]} style={styles.container}>
        
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
      </LinearGradient>
    </View>
  );
}
