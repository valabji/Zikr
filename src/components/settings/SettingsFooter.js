import React from 'react';
import { View, Platform } from 'react-native';
import { useColors } from '@/constants/Colors';
import { SPACING, CONTENT_MAX_WIDTH, withAlpha } from '@/constants/settingsTokens';
import { t } from '@/locales/i18n';
import SettingsButton from './SettingsButton';

export default function SettingsFooter({ onDefault, onSave, showSave }) {
  const colors = useColors();
  return (
    <View style={{
      flexDirection: 'row',
      gap: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.accent, 'hairline'),
      ...(Platform.OS === 'web' ? { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } : null),
    }}>
      <SettingsButton
        variant="outline"
        icon="rotate-ccw"
        label={t('settings.default')}
        onPress={onDefault}
        fullWidth
        style={{ flex: 1 }}
      />
      {showSave ? (
        <SettingsButton
          testID="save-settings"
          variant="primary"
          icon="save"
          label={t('common.save')}
          onPress={onSave}
          fullWidth
          style={{ flex: 1 }}
        />
      ) : null}
    </View>
  );
}
