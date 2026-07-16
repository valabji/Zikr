import * as React from 'react';
import { Modal, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { textStyles } from '@/constants/Fonts';
import { t } from '@/locales/i18n';

const BUBBLE_WIDTH = 180;
const EDGE_MARGIN = 10;

export default function QuranWordTooltip({ word, onClose, colors }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!word) return null;

  const left = Math.max(EDGE_MARGIN, Math.min(word.x - BUBBLE_WIDTH / 2, screenWidth - BUBBLE_WIDTH - EDGE_MARGIN));
  const showAbove = word.y > 120;
  const top = showAbove ? Math.max(EDGE_MARGIN, word.y - 90) : Math.min(word.y + 16, screenHeight - 100);

  return (
    <Modal visible={!!word} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable testID="quran-word-tooltip-backdrop" onPress={onClose} style={{ flex: 1 }}>
        <View
          testID="quran-word-tooltip"
          style={{
            position: 'absolute',
            left,
            top,
            width: BUBBLE_WIDTH,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.accent + '55',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Hafs',
              fontSize: 22,
              color: colors.text,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginBottom: 6,
            }}
          >
            {word.ar}
          </Text>
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, textAlign: 'center' }]}>
            {word.en || t('quran.wbwEmpty')}
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}
