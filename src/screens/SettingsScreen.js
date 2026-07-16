import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useTheme } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha } from '@/constants/settingsTokens';
import { t, setLanguage } from '@/locales/i18n';
import CustomHeader from '@/components/CHeader';
import { getAzkar } from '@/utils/AzkarStore';
import { THEME_VARIANT_KEYS } from '@/constants/themes';
import { VIBRATION_TYPES, VIBRATION_INTENSITY } from '@/utils/Vibration';
import { useTestedMode, setTestedMode } from '@/utils/TestedMode';
import { useAudio } from '@/utils/Sounds';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { useVibrationSettings } from '@/hooks/useVibrationSettings';
import { useSettingsTutorial } from '@/hooks/useSettingsTutorial';
import {
  SettingsContainer, SettingsSection, SettingsRow, SettingsField,
  SettingsToggle, SettingsSegmented, SettingsSlider, SettingsButton, SettingsSelect,
  MenuConfigEditor,
} from '@/components/settings';
import SettingsTutorialOverlay from '@/components/settings/SettingsTutorialOverlay';
import { APP_KEYS } from '@/constants/StorageKeys';

export default function SettingsScreen({ navigation }) {
  const colors = useColors();
  const { theme, themes, hiddenThemes, variant, autoVariant, lockedVariant, setAutoVariantEnabled, lockVariant } = useTheme();
  const { playClick } = useAudio();
  const { getTextAlign } = useRTL();
  const testedMode = useTestedMode();

  const [currentLang, setCurrentLang] = useState('ar');
  const [initialLang, setInitialLang] = useState('ar');
  const [languageChanged, setLanguageChanged] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const scrollViewRef = useRef(null);

  const {
    autoSave, initialScreen, tempScreen, tempTheme, tempVolume, tempFontSize, tempViewMode,
    handleVolumeChange, handleVolumeChangeComplete, handleFontSizeChange, handleFontSizeChangeComplete,
    handleAutoSaveToggle, handleScreenChange, handleThemeChange, handleViewModeChange,
    applyForm, resetForm, hasUnsavedForm,
  } = useSettingsForm();

  const {
    showVibration, tempTasbihVibration, tempAzkarVibration, tempVibrationIntensity,
    handleTasbihVibrationChange, handleAzkarVibrationChange, handleIntensityChange,
    applyVibration, resetVibration, hasUnsavedVibration,
  } = useVibrationSettings(autoSave);

  const {
    isTutorialVisible, currentTutorialStep, tutorialSteps, highlightVisible, animatedProgressStyle,
    openTutorial, closeTutorial, nextTutorialStep, previousTutorialStep, registerTarget,
  } = useSettingsTutorial({ showVibration, currentLang, scrollViewRef });

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
  const themeOptions = Object.entries(themes)
    .filter(([id]) => !hiddenThemes.includes(id) || id === theme)
    .map(([id, v]) => ({ id, label: currentLang === 'ar' ? v.nameAr : v.name }));
  const screenOptions = screens.map((s) => ({ id: s.id, label: label(s) }));
  const viewModeOptions = viewModes.map((m) => ({ id: m.id, label: label(m) }));
  const azkarVibrationOptions = vibrationOptions.map((o) => ({ id: o.id, label: label(o) }));
  const intensitySelectOptions = intensityOptions.map((o) => ({ id: o.id, label: label(o) }));

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
  }, [navigation]);

  const hasUnsavedChanges = useCallback(() => {
    if (currentLang !== initialLang) return true;
    return hasUnsavedForm() || hasUnsavedVibration();
  }, [currentLang, initialLang, hasUnsavedForm, hasUnsavedVibration]);

  const handleBackPress = async () => {
    if (isFirstTime) {
      await AsyncStorage.setItem(APP_KEYS.FIRST_TIME_SETTINGS, 'visited');
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

  const handleTestedModeToggle = async () => {
    playClick();
    await setTestedMode(!testedMode);
  };

  const handleDefault = async () => {
    playClick();
    await resetForm();
    await handleLanguageChange('ar');
    await resetVibration();
  };

  const handleSave = async () => {
    playClick();

    const wasFirstTime = isFirstTime;

    if (isFirstTime) {
      await AsyncStorage.setItem(APP_KEYS.FIRST_TIME_SETTINGS, 'visited');
      setIsFirstTime(false);
      navigation.setOptions({
        headerLeft: undefined,
        gestureEnabled: true
      });
    }

    await applyForm();
    await applyVibration();

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
            <SettingsRow
              testID="theme-manager-entry"
              icon="sliders"
              label={t('themeManager.title')}
              chevron
              onPress={() => { playClick(); navigation.navigate('ThemeManager'); }}
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
                      {getAzkar()[0]?.zekr || 'الحمد لله وحده، والصلاة والسلام على من لا نبي بعده'}
                    </Text>
                  </View>
                )}
              />
            </View>
          </SettingsSection>
        )}

        <MenuConfigEditor />

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
        <SettingsTutorialOverlay
          steps={tutorialSteps}
          currentStep={currentTutorialStep}
          animatedProgressStyle={animatedProgressStyle}
          onNext={nextTutorialStep}
          onPrevious={previousTutorialStep}
          onClose={closeTutorial}
        />
      ) : null}
    </View>
  );
}
