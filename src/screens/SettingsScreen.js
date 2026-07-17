import React, { useRef } from 'react';
import { View } from 'react-native';
import { useColors, useTheme } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import CustomHeader from '@/components/CustomHeader';
import { THEME_VARIANT_KEYS } from '@/constants/themes';
import { useTestedMode, setTestedMode } from '@/utils/TestedMode';
import { useAudio } from '@/utils/Sounds';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { useVibrationSettings } from '@/hooks/useVibrationSettings';
import { useSettingsTutorial } from '@/hooks/useSettingsTutorial';
import { useSettingsActions } from '@/hooks/useSettingsActions';
import {
  SettingsContainer, SettingsSection, SettingsRow, SettingsField,
  SettingsToggle, SettingsSegmented, SettingsSelect,
  MenuConfigEditor, TutorialTarget, SettingsFooter, SettingsSliderField, FontSizePreview,
} from '@/components/settings';
import SettingsTutorialOverlay from '@/components/settings/SettingsTutorialOverlay';
import {
  SCREENS, VIEW_MODES, VIBRATION_OPTIONS, INTENSITY_OPTIONS, localizeOptions,
} from '@/constants/settingsOptions';

export default function SettingsScreen({ navigation }) {
  const colors = useColors();
  const { theme, themes, hiddenThemes, variant, autoVariant, lockedVariant, setAutoVariantEnabled, lockVariant } = useTheme();
  const { playClick } = useAudio();
  const testedMode = useTestedMode();
  const scrollViewRef = useRef(null);

  const form = useSettingsForm();
  const {
    autoSave, tempScreen, tempTheme, tempVolume, tempFontSize, tempViewMode,
    handleVolumeChange, handleVolumeChangeComplete, handleFontSizeChange, handleFontSizeChangeComplete,
    handleAutoSaveToggle, handleScreenChange, handleThemeChange, handleViewModeChange,
  } = form;

  const vibration = useVibrationSettings(autoSave);
  const {
    showVibration, tempTasbihVibration, tempAzkarVibration, tempVibrationIntensity,
    handleTasbihVibrationChange, handleAzkarVibrationChange, handleIntensityChange,
  } = vibration;

  const {
    currentLang, isFirstTime, handleLanguageChange, handleDefault, handleSave, handleBackPress,
  } = useSettingsActions({ navigation, playClick, form, vibration });

  const {
    isTutorialVisible, currentTutorialStep, tutorialSteps, highlightVisible, animatedProgressStyle,
    openTutorial, closeTutorial, nextTutorialStep, previousTutorialStep, registerTarget,
  } = useSettingsTutorial({ showVibration, currentLang, scrollViewRef });

  const themeOptions = Object.entries(themes)
    .filter(([id]) => !hiddenThemes.includes(id) || id === theme)
    .map(([id, v]) => ({ id, label: currentLang === 'ar' ? v.nameAr : v.name }));
  const screenOptions = localizeOptions(SCREENS, currentLang);
  const viewModeOptions = localizeOptions(VIEW_MODES, currentLang);
  const azkarVibrationOptions = localizeOptions(VIBRATION_OPTIONS, currentLang);
  const intensitySelectOptions = localizeOptions(INTENSITY_OPTIONS, currentLang);

  const highlightedKey = isTutorialVisible && highlightVisible
    ? tutorialSteps[currentTutorialStep]?.key
    : null;

  const target = (key, node) => (
    <TutorialTarget onLayout={registerTarget(key)} highlighted={highlightedKey === key}>
      {node}
    </TutorialTarget>
  );

  const handleTestedModeToggle = async () => {
    playClick();
    await setTestedMode(!testedMode);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="settings-screen">
      <CustomHeader
        title={t("navigation.settings")}
        navigation={navigation}
        Right={isFirstTime && !autoSave ? () => (<View style={{ flex: 1 }} />) : false}
        onBackPress={handleBackPress}
      />

      <SettingsContainer
        scrollRef={scrollViewRef}
        footer={<SettingsFooter onDefault={handleDefault} onSave={handleSave} showSave={!autoSave} />}
      >
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
            <SettingsSliderField
              label={t('settings.clickVolume')}
              value={tempVolume}
              min={0}
              max={1}
              onChange={handleVolumeChange}
              onSlidingComplete={handleVolumeChangeComplete}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </SettingsSection>
        )}

        {target('fontSize',
          <SettingsSection style={{ marginBottom: 0 }}>
            <SettingsSliderField
              label={t('settings.fontSize')}
              value={tempFontSize}
              min={12}
              max={28}
              step={1}
              onChange={handleFontSizeChange}
              onSlidingComplete={handleFontSizeChangeComplete}
              format={(v) => `${Math.round(v)}px`}
              preview={(v) => <FontSizePreview size={v} />}
            />
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
