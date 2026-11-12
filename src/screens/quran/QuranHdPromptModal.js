import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { t } from '@/locales/i18n';
import { SPACING, RADIUS, withAlpha, webCursor } from '@/constants/settingsTokens';
import { SettingsModalShell, SettingsButton } from '@/components/settings';

export default function QuranHdPromptModal({ visible, version, sizeLabel, onDownload, onDismiss }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  const [dontAskAgain, setDontAskAgain] = React.useState(false);

  React.useEffect(() => {
    if (visible) setDontAskAgain(false);
  }, [visible]);

  return (
    <SettingsModalShell visible={visible} onClose={() => onDismiss(dontAskAgain)} title={t('quran.hdPromptTitle')}>
      <View style={{ padding: SPACING.xl }}>
        <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: withAlpha(colors.accent, 0.14),
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Feather name="download-cloud" size={28} color={colors.accent} />
          </View>
        </View>
        <Text style={[
          textStyles.base,
          { color: colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: SPACING.lg },
        ]}>
          {t('quran.hdPromptBody', { size: sizeLabel })}
        </Text>

        <TouchableOpacity
          onPress={() => setDontAskAgain((v) => !v)}
          style={[{ flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            marginBottom: SPACING.md,
          }, webCursor]}
        >
          <View style={{
            width: 20, height: 20, borderRadius: RADIUS.control / 2.5,
            borderWidth: 1.5,
            borderColor: dontAskAgain ? colors.accent : colors.textSecondary,
            backgroundColor: dontAskAgain ? colors.accent : 'transparent',
            justifyContent: 'center', alignItems: 'center',
            marginHorizontal: SPACING.xs,
          }}>
            {dontAskAgain ? <Feather name="check" size={14} color={colors.primaryDark} /> : null}
          </View>
          <Text style={[textStyles.base, {
            color: colors.text,
            fontSize: 14,
            marginHorizontal: 10,
            flex: 1,
            textAlign: getTextAlign('left'),
          }]}>
            {t('quran.hdPromptDontAskAgain')}
          </Text>
        </TouchableOpacity>

        <View style={[{ flexDirection: 'row', gap: 10 }]}>
          <SettingsButton
            variant="outline"
            fullWidth
            label={t('quran.hdPromptNotNow')}
            onPress={() => onDismiss(dontAskAgain)}
            style={{ flex: 1 }}
          />
          <SettingsButton
            variant="primary"
            fullWidth
            label={t('quran.hdPromptDownload')}
            onPress={() => onDownload(dontAskAgain)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </SettingsModalShell>
  );
}
