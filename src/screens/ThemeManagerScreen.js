import React, { useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import { useColors, useTheme } from '@/constants/Colors';
import { t, getCurrentLanguage } from '@/locales/i18n';
import CustomHeader from '@/components/CustomHeader';
import {
  SettingsContainer,
  SettingsSection,
  SettingsRow,
  SettingsModalShell,
} from '@/components/settings';
import { SPACING, withAlpha } from '@/constants/settingsTokens';
import { themes as builtinThemes } from '@/constants/themes';
import { cloneTheme, generateThemeId, exportTheme, pickAndImportTheme } from '@/utils/ThemeManager';

const SWATCH_KEYS = ['primary', 'accent', 'background', 'text'];

const ThemeSwatch = ({ theme, borderColor }) => (
  <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
    {SWATCH_KEYS.map((key) => (
      <View
        key={key}
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: theme[key],
          borderWidth: 1,
          borderColor,
        }}
      />
    ))}
  </View>
);

export default function ThemeManagerScreen({ navigation }) {
  const colors = useColors();
  const {
    theme: activeTheme,
    setTheme,
    customThemes,
    hiddenThemes,
    saveCustomTheme,
    deleteCustomTheme,
    setThemeHidden,
    reloadCustomThemes,
  } = useTheme();
  const [selected, setSelected] = useState(null);
  const lang = getCurrentLanguage();

  const themeName = (theme) => (lang === 'ar' ? theme.nameAr : theme.name) || theme.name;

  const showError = (message) => {
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert(t('common.error'), message);
  };

  const confirm = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.ok'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleImport = async () => {
    try {
      const result = await pickAndImportTheme();
      if (result) await reloadCustomThemes();
    } catch (error) {
      showError(t('themeManager.importFailed'));
    }
  };

  const cloneToEditor = async (sourceKey, sourceTheme) => {
    const id = generateThemeId();
    const copy = cloneTheme(sourceTheme, `${themeName(sourceTheme)} *`, `${sourceTheme.nameAr || sourceTheme.name} *`);
    await saveCustomTheme(id, copy);
    navigation.navigate('ThemeEditor', { themeId: id });
  };

  const handleExport = async (theme) => {
    try {
      await exportTheme(theme);
    } catch (error) {
      showError(t('themeManager.exportFailed'));
    }
  };

  const handleDelete = (id) => {
    confirm(t('themeManager.deleteTheme'), t('themeManager.deleteConfirm'), async () => {
      setSelected(null);
      await deleteCustomTheme(id);
    });
  };

  const closeActions = () => setSelected(null);

  const renderThemeRow = (id, theme, isCustom) => {
    const hidden = hiddenThemes.includes(id);
    const isActive = id === activeTheme;
    return (
      <SettingsRow
        key={id}
        testID={`theme-row-${id}`}
        label={themeName(theme) + (isActive ? ` — ${t('themeManager.active')}` : '')}
        description={hidden ? t('themeManager.hidden') : null}
        trailing={<ThemeSwatch theme={theme} borderColor={withAlpha(colors.accent, 'border')} />}
        chevron
        onPress={() => setSelected({ id, theme, isCustom })}
      />
    );
  };

  const actionTheme = selected?.theme;
  const actionHidden = selected ? hiddenThemes.includes(selected.id) : false;
  const actionIsActive = selected?.id === activeTheme;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader title={t('themeManager.title')} navigation={navigation} testID="theme-manager-header" />
      <SettingsContainer testID="theme-manager-screen">
        <SettingsSection title={t('themeManager.actions')}>
          <SettingsRow
            testID="theme-new"
            icon="plus"
            label={t('themeManager.newTheme')}
            description={t('themeManager.newThemeDescription')}
            onPress={() => cloneToEditor(activeTheme, { ...builtinThemes, ...customThemes }[activeTheme])}
          />
          <SettingsRow
            testID="theme-import"
            icon="download"
            label={t('themeManager.importTheme')}
            description={t('themeManager.importDescription')}
            onPress={handleImport}
          />
        </SettingsSection>

        {Object.keys(customThemes).length > 0 ? (
          <SettingsSection title={t('themeManager.customThemes')}>
            {Object.entries(customThemes).map(([id, theme]) => renderThemeRow(id, theme, true))}
          </SettingsSection>
        ) : null}

        <SettingsSection title={t('themeManager.builtinThemes')} footnote={t('themeManager.hiddenFootnote')}>
          {Object.entries(builtinThemes).map(([id, theme]) => renderThemeRow(id, theme, false))}
        </SettingsSection>
      </SettingsContainer>

      <SettingsModalShell
        visible={!!selected}
        onClose={closeActions}
        title={actionTheme ? themeName(actionTheme) : ''}
        testID="theme-actions-modal"
      >
        {selected ? (
          <View style={{ paddingBottom: SPACING.lg }}>
            <SettingsRow
              testID="theme-action-apply"
              icon="check-circle"
              label={t('themeManager.apply')}
              disabled={actionIsActive}
              onPress={async () => {
                closeActions();
                await setTheme(selected.id);
              }}
            />
            {selected.isCustom ? (
              <SettingsRow
                testID="theme-action-edit"
                icon="edit-2"
                label={t('themeManager.edit')}
                onPress={() => {
                  closeActions();
                  navigation.navigate('ThemeEditor', { themeId: selected.id });
                }}
              />
            ) : null}
            <SettingsRow
              testID="theme-action-clone"
              icon="copy"
              label={t('themeManager.clone')}
              onPress={async () => {
                closeActions();
                await cloneToEditor(selected.id, selected.theme);
              }}
            />
            <SettingsRow
              testID="theme-action-export"
              icon="upload"
              label={t('themeManager.export')}
              onPress={async () => {
                closeActions();
                await handleExport(selected.theme);
              }}
            />
            <SettingsRow
              testID="theme-action-hide"
              icon={actionHidden ? 'eye' : 'eye-off'}
              label={actionHidden ? t('themeManager.show') : t('themeManager.hide')}
              disabled={actionIsActive && !actionHidden}
              description={actionIsActive && !actionHidden ? t('themeManager.cannotHideActive') : null}
              onPress={async () => {
                closeActions();
                await setThemeHidden(selected.id, !actionHidden);
              }}
            />
            {selected.isCustom ? (
              <SettingsRow
                testID="theme-action-delete"
                icon="trash-2"
                label={t('themeManager.delete')}
                destructive
                onPress={() => handleDelete(selected.id)}
              />
            ) : null}
          </View>
        ) : null}
      </SettingsModalShell>
    </View>
  );
}
