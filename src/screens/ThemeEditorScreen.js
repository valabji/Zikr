import React, { useState } from 'react';
import { View, Text, TextInput, Image, Alert, Platform } from 'react-native';
import { useColors, useTheme } from '@/constants/Colors';
import { t } from '@/locales/i18n';
import { useRTL } from '@/hooks/useRTL';
import CustomHeader from '@/components/CustomHeader';
import ColorPickerModal from '@/components/ColorPickerModal';
import {
  SettingsContainer,
  SettingsSection,
  SettingsRow,
  SettingsField,
  SettingsButton,
  SettingsToggle,
} from '@/components/settings';
import { SPACING, RADIUS, withAlpha } from '@/constants/settingsTokens';
import { textStyles } from '@/constants/Fonts';
import { THEME_COLOR_KEYS, BACKGROUND_KEYS, validateTheme, sanitizeTheme, saveThemeAsset } from '@/utils/ThemeManager';

const ColorDot = ({ color, borderColor }) => (
  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color, borderWidth: 1, borderColor }} />
);

export default function ThemeEditorScreen({ navigation, route }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  const { customThemes, saveCustomTheme } = useTheme();
  const themeId = route.params?.themeId;
  const [draft, setDraft] = useState(() => ({ ...(customThemes[themeId] || {}) }));
  const [picker, setPicker] = useState(null);

  const border = withAlpha(colors.accent, 'border');

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const openPicker = (label, color, apply) => setPicker({ label, color, apply });

  const applyPicked = (hex) => {
    picker.apply(hex);
    setPicker(null);
  };

  const setGradientStop = (index, hex) => {
    setDraft((prev) => ({
      ...prev,
      headerGradient: prev.headerGradient.map((c, i) => (i === index ? hex : c)),
    }));
  };

  const setItemGradientStop = (pairIndex, stopIndex, hex) => {
    setDraft((prev) => ({
      ...prev,
      itemGradients: prev.itemGradients.map((pair, i) =>
        i === pairIndex ? pair.map((c, j) => (j === stopIndex ? hex : c)) : pair
      ),
    }));
  };

  const pickBackground = async (key) => {
    const ImagePicker = require('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets || !result.assets.length) return;
    const saved = await saveThemeAsset(themeId, key, result.assets[0].uri);
    setField(key, saved);
  };

  const pickClickSound = async () => {
    const DocumentPicker = require('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets || !result.assets.length) return;
    const saved = await saveThemeAsset(themeId, 'clickSound', result.assets[0].uri);
    setField('clickSound', saved);
  };

  const previewClickSound = async () => {
    const { Audio } = require('expo-av');
    const { sound } = await Audio.Sound.createAsync({ uri: draft.clickSound }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => { if (status.didJustFinish) sound.unloadAsync(); });
  };

  const handleSave = async () => {
    const clean = sanitizeTheme(draft);
    const error = validateTheme(clean);
    if (error) {
      const message = error === 'missingName' ? t('themeManager.errorMissingName') : t('themeManager.errorBadColor');
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert(t('common.error'), message);
      return;
    }
    await saveCustomTheme(themeId, clean);
    navigation.goBack();
  };

  const inputStyle = [textStyles.body, {
    color: colors.text,
    borderWidth: 1,
    borderColor: border,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    textAlign: getTextAlign('left'),
  }];

  if (!customThemes[themeId]) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <CustomHeader title={t('themeManager.editTheme')} navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader title={t('themeManager.editTheme')} navigation={navigation} testID="theme-editor-header" />
      <SettingsContainer
        testID="theme-editor-screen"
        footer={(
          <View style={{ padding: SPACING.lg, backgroundColor: colors.background }}>
            <SettingsButton testID="theme-save" label={t('common.save')} onPress={handleSave} fullWidth />
          </View>
        )}
      >
        <SettingsSection title={t('themeManager.nameSection')}>
          <SettingsField label={t('themeManager.nameEn')}>
            <TextInput
              testID="theme-name-en"
              value={draft.name}
              onChangeText={(v) => setField('name', v)}
              style={inputStyle}
            />
          </SettingsField>
          <SettingsField label={t('themeManager.nameAr')}>
            <TextInput
              testID="theme-name-ar"
              value={draft.nameAr}
              onChangeText={(v) => setField('nameAr', v)}
              style={inputStyle}
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection title={t('themeManager.preview')}>
          <View testID="theme-preview" style={{ padding: SPACING.lg, backgroundColor: draft.background }}>
            <View style={{ backgroundColor: draft.primary, borderRadius: RADIUS.control, padding: SPACING.md, marginBottom: SPACING.sm }}>
              <Text style={[textStyles.body, { color: draft.accent, textAlign: 'center' }]}>{draft.name}</Text>
            </View>
            <View style={{ backgroundColor: draft.surface, borderRadius: RADIUS.control, padding: SPACING.md }}>
              <Text style={[textStyles.body, { color: draft.text }]}>{t('themeManager.previewText')}</Text>
              <Text style={[textStyles.caption, { color: draft.textSecondary }]}>{t('themeManager.previewSecondary')}</Text>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title={t('themeManager.colorsSection')}>
          {THEME_COLOR_KEYS.map((key) => (
            <SettingsRow
              key={key}
              testID={`theme-color-${key}`}
              label={t(`themeManager.colorKeys.${key}`)}
              value={(draft[key] || '').toUpperCase()}
              trailing={<ColorDot color={draft[key]} borderColor={border} />}
              onPress={() => openPicker(t(`themeManager.colorKeys.${key}`), draft[key], (hex) => setField(key, hex))}
            />
          ))}
        </SettingsSection>

        {draft.headerGradient ? (
          <SettingsSection title={t('themeManager.headerGradient')}>
            {draft.headerGradient.map((stop, i) => (
              <SettingsRow
                key={i}
                testID={`theme-gradient-${i}`}
                label={`${t('themeManager.gradientStop')} ${i + 1}`}
                value={stop.toUpperCase()}
                trailing={<ColorDot color={stop} borderColor={border} />}
                onPress={() => openPicker(`${t('themeManager.gradientStop')} ${i + 1}`, stop, (hex) => setGradientStop(i, hex))}
              />
            ))}
          </SettingsSection>
        ) : null}

        {draft.itemGradients ? (
          <SettingsSection title={t('themeManager.itemGradients')}>
            {draft.itemGradients.flatMap((pair, i) =>
              pair.map((stop, j) => (
                <SettingsRow
                  key={`${i}-${j}`}
                  label={`${t('themeManager.itemGradient')} ${i + 1} — ${t('themeManager.gradientStop')} ${j + 1}`}
                  value={stop.toUpperCase()}
                  trailing={<ColorDot color={stop} borderColor={border} />}
                  onPress={() => openPicker(`${t('themeManager.itemGradient')} ${i + 1}`, stop, (hex) => setItemGradientStop(i, j, hex))}
                />
              ))
            )}
            {draft.itemFg ? (
              <SettingsRow
                label={t('themeManager.itemFg')}
                value={draft.itemFg.toUpperCase()}
                trailing={<ColorDot color={draft.itemFg} borderColor={border} />}
                onPress={() => openPicker(t('themeManager.itemFg'), draft.itemFg, (hex) => setField('itemFg', hex))}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        <SettingsSection title={t('themeManager.pattern')}>
          <SettingsRow
            testID="theme-pattern-color"
            label={t('themeManager.patternColor')}
            value={(draft.patternColor || draft.primaryDark || '').toUpperCase()}
            trailing={<ColorDot color={draft.patternColor || draft.primaryDark} borderColor={border} />}
            onPress={() => openPicker(t('themeManager.patternColor'), draft.patternColor || draft.primaryDark, (hex) => setField('patternColor', hex))}
          />
          {draft.patternColor ? (
            <SettingsRow
              testID="theme-pattern-reset"
              label={t('common.reset')}
              onPress={() => setField('patternColor', undefined)}
            />
          ) : null}
          <SettingsRow
            testID="theme-pattern-hide"
            label={t('themeManager.hidePattern')}
            trailing={(
              <SettingsToggle
                testID="theme-pattern-hide-toggle"
                value={!!draft.hidePattern}
                onValueChange={(v) => setField('hidePattern', v || undefined)}
              />
            )}
          />
        </SettingsSection>

        {Platform.OS !== 'web' ? (
          <SettingsSection title={t('themeManager.sounds')}>
            <SettingsField label={t('themeManager.clickSound')}>
              <View style={{ flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' }}>
                <SettingsButton
                  testID="theme-pick-clickSound"
                  label={t('themeManager.pickSound')}
                  variant="outline"
                  onPress={pickClickSound}
                />
                {draft.clickSound ? (
                  <SettingsButton
                    testID="theme-play-clickSound"
                    label={t('themeManager.playSound')}
                    variant="outline"
                    onPress={previewClickSound}
                  />
                ) : null}
                {draft.clickSound ? (
                  <SettingsButton
                    testID="theme-clear-clickSound"
                    label={t('themeManager.removeSound')}
                    variant="destructive"
                    onPress={() => setField('clickSound', undefined)}
                  />
                ) : null}
              </View>
            </SettingsField>
          </SettingsSection>
        ) : null}

        {Platform.OS !== 'web' ? (
          <SettingsSection title={t('themeManager.backgrounds')} description={t('themeManager.backgroundsDescription')}>
            {BACKGROUND_KEYS.map((key) => (
              <SettingsField key={key} label={t(`themeManager.${key}`)}>
                {draft[key] ? (
                  <Image
                    source={{ uri: draft[key] }}
                    style={{ width: '100%', height: 120, borderRadius: RADIUS.control, marginBottom: SPACING.sm }}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  <SettingsButton
                    testID={`theme-pick-${key}`}
                    label={t('themeManager.pickImage')}
                    variant="outline"
                    onPress={() => pickBackground(key)}
                  />
                  {draft[key] ? (
                    <SettingsButton
                      testID={`theme-clear-${key}`}
                      label={t('themeManager.removeImage')}
                      variant="destructive"
                      onPress={() => setField(key, undefined)}
                    />
                  ) : null}
                </View>
              </SettingsField>
            ))}
          </SettingsSection>
        ) : null}
      </SettingsContainer>

      <ColorPickerModal
        visible={!!picker}
        title={picker?.label}
        color={picker?.color}
        onDone={applyPicked}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
