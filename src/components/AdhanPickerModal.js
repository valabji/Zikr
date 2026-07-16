import React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { t, isRTL } from '@/locales/i18n';
import { SPACING } from '@/constants/settingsTokens';
import { ADHAN_CATALOG } from '@/constants/AdhanCatalog';
import AdhanDownloader from '@/utils/AdhanDownloader';
import { SettingsRow, SettingsModalShell } from '@/components/settings';

const adhanStatus = (option, st) => {
  if (option.bundled) return isRTL() ? option.reciterAr : option.reciterEn;
  if (st?.downloading) return `${t('settings.notifications.downloading')} ${Math.round((st.progress || 0) * 100)}%`;
  if (st?.downloaded) return t('settings.notifications.downloaded');
  return `${(option.bytes / 1048576).toFixed(1)} MB · ${t('settings.notifications.tapToDownload')}`;
};

export default function AdhanPickerModal({ visible, onClose, selectedAdhan, adhanState, onSelect }) {
  const colors = useColors();
  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={t('settings.notifications.adhanRecitation')}
    >
      <ScrollView bounces={false}>
        {ADHAN_CATALOG.map((option) => {
          const st = adhanState[option.id];
          const isDownloaded = option.bundled || st?.downloaded;
          return (
            <SettingsRow
              key={option.id}
              label={isRTL() ? option.nameAr : option.nameEn}
              description={adhanStatus(option, st)}
              labelStyle={selectedAdhan === option.id ? { color: colors.accent, fontWeight: '600' } : null}
              onPress={() => onSelect(option.id)}
              trailing={(
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!option.bundled && st?.downloaded ? (
                    <Pressable onPress={() => AdhanDownloader.remove(option.id)} hitSlop={8} style={{ paddingHorizontal: SPACING.sm }}>
                      <Feather name="trash-2" size={18} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                  {st?.downloading
                    ? <ActivityIndicator size="small" color={colors.accent} />
                    : selectedAdhan === option.id
                      ? <Feather name="check" size={20} color={colors.accent} />
                      : !isDownloaded
                        ? <Feather name="download" size={20} color={colors.textSecondary} />
                        : null}
                </View>
              )}
            />
          );
        })}
      </ScrollView>
    </SettingsModalShell>
  );
}
