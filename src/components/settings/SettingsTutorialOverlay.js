import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, shadow, webCursor } from '@/constants/settingsTokens';
import { t } from '@/locales/i18n';
import SettingsButton from './SettingsButton';

export default function SettingsTutorialOverlay({ steps, currentStep, animatedProgressStyle, onNext, onPrevious, onClose }) {
  const colors = useColors();
  const { isRTL, getTextAlign } = useRTL();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 96,
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        zIndex: 999,
      }}
    >
      <View style={[{
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        backgroundColor: colors.surface,
        borderRadius: RADIUS.modal,
        borderWidth: 1,
        borderColor: withAlpha(colors.accent, 'border'),
        overflow: 'hidden',
      }, shadow(colors.shadowColor)]}>
        <View style={{ padding: SPACING.lg, backgroundColor: withAlpha(colors.accent, 'subtle') }}>
          <Text style={[textStyles.subtitle, { color: colors.text, fontWeight: 'bold', textAlign: 'center' }]}>
            {t('settings.tutorial.title')}
          </Text>
          <View style={{ height: 4, borderRadius: 2, marginTop: SPACING.sm, overflow: 'hidden', backgroundColor: withAlpha(colors.accent, 'hairline') }}>
            <Animated.View style={[{ height: '100%', backgroundColor: colors.accent, borderRadius: 2 }, animatedProgressStyle]} />
          </View>
        </View>

        <View style={{ padding: SPACING.lg }}>
          <Text style={[textStyles.body, { color: colors.text, fontWeight: 'bold', marginBottom: SPACING.sm, textAlign: getTextAlign('left') }]}>
            {steps[currentStep]?.title}
          </Text>
          <Text style={[textStyles.bodySmall, { color: colors.textSecondary, lineHeight: 22, textAlign: getTextAlign('left') }]}>
            {steps[currentStep]?.description}
          </Text>
        </View>

        <View style={[{ flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.lg,
          borderTopWidth: 1,
          borderTopColor: withAlpha(colors.accent, 'hairline'),
        }]}>
          <SettingsButton
            variant="outline"
            label={t('settings.tutorial.previous')}
            onPress={onPrevious}
            disabled={currentStep === 0}
          />
          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
            {currentStep + 1} / {steps.length}
          </Text>
          <SettingsButton
            variant="primary"
            label={currentStep === steps.length - 1
              ? t('settings.tutorial.finish')
              : t('settings.tutorial.next')}
            onPress={currentStep === steps.length - 1 ? onClose : onNext}
          />
        </View>

        <Pressable
          onPress={onClose}
          style={[{ position: 'absolute', top: SPACING.sm, ...(Platform.OS === 'web' && isRTL ? { left: SPACING.sm } : { right: SPACING.sm }), padding: SPACING.sm }, webCursor]}
        >
          <Feather name="x" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
