import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';

export default function QuranHdPromptModal({ visible, version, sizeLabel, onDownload, onDismiss }) {
  const colors = useColors();
  const [dontAskAgain, setDontAskAgain] = React.useState(false);

  React.useEffect(() => {
    if (visible) setDontAskAgain(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => onDismiss(dontAskAgain)}>
      <Pressable
        onPress={() => onDismiss(dontAskAgain)}
        style={{
          flex: 1,
          backgroundColor: colors.overlayBackground,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation && e.stopPropagation()}
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            paddingTop: 20,
            paddingBottom: 8,
            paddingHorizontal: 20,
            maxWidth: 420,
            width: '100%',
          }}
        >
          <SafeAreaView>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: colors.accent + '22',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Feather name="download-cloud" size={28} color={colors.accent} />
              </View>
            </View>
            <Text style={[
              textStyles.header,
              { color: colors.text, textAlign: 'center', marginBottom: 8 },
            ]}>
              {t('quran.hdPromptTitle')}
            </Text>
            <Text style={[
              textStyles.base,
              { color: colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
            ]}>
              {t('quran.hdPromptBody', { size: sizeLabel })}
            </Text>

            <TouchableOpacity
              onPress={() => setDontAskAgain((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 4,
                borderWidth: 1.5,
                borderColor: dontAskAgain ? colors.accent : colors.textSecondary,
                backgroundColor: dontAskAgain ? colors.accent : 'transparent',
                justifyContent: 'center', alignItems: 'center',
                marginHorizontal: 4,
              }}>
                {dontAskAgain ? <Feather name="check" size={14} color={colors.primaryDark} /> : null}
              </View>
              <Text style={[textStyles.base, {
                color: colors.text,
                fontSize: 14,
                marginHorizontal: 10,
                flex: 1,
                textAlign: isRTL() ? 'right' : 'left',
              }]}>
                {t('quran.hdPromptDontAskAgain')}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => onDismiss(dontAskAgain)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.accent + '44',
                  borderRadius: 8,
                }}
              >
                <Text style={[textStyles.subtitle, { color: colors.text, fontSize: 14 }]}>
                  {t('quran.hdPromptNotNow')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDownload(dontAskAgain)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: colors.accent,
                }}
              >
                <Text style={[textStyles.subtitle, { color: colors.primaryDark, fontSize: 14 }]}>
                  {t('quran.hdPromptDownload')}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
