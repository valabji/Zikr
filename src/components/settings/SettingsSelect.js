import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { t } from '@/locales/i18n';
import { textStyles } from '@/constants/Fonts';
import { SPACING, RADIUS, withAlpha, webCursor } from '@/constants/settingsTokens';
import SettingsRow from './SettingsRow';

const isWeb = Platform.OS === 'web';

export default function SettingsSelect({
  value,
  options,
  onChange,
  label,
  description,
  title,
  placeholder,
  testID,
  triggerTestID,
  disabled,
}) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <SettingsRow
        testID={triggerTestID || testID}
        label={label}
        description={description}
        value={selected ? selected.label : placeholder}
        onPress={() => setOpen(true)}
        chevron
        disabled={disabled}
      />
      <Modal
        visible={open}
        transparent
        animationType={isWeb ? 'fade' : 'slide'}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: colors.overlayBackground,
            justifyContent: isWeb ? 'center' : 'flex-end',
            alignItems: 'center',
            padding: isWeb ? SPACING.xl : 0,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={[{
              width: '100%',
              backgroundColor: colors.surface,
              paddingBottom: isWeb ? SPACING.sm : SPACING.xl,
              overflow: 'hidden',
            }, isWeb
              ? { maxWidth: 460, borderRadius: RADIUS.modal }
              : { borderTopLeftRadius: RADIUS.modal, borderTopRightRadius: RADIUS.modal }]}
          >
            {!isWeb ? (
              <View style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: withAlpha(colors.textSecondary, 0.4),
                marginTop: SPACING.sm,
              }} />
            ) : null}

            <View style={[{ flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              borderBottomWidth: 1,
              borderBottomColor: withAlpha(colors.accent, 'hairline'),
            }]}>
              <Text style={[textStyles.subtitle, {
                color: colors.text,
                flex: 1,
                fontSize: 17,
                textAlign: getTextAlign('left'),
              }]} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')} style={[{ padding: 4 }, webCursor]} hitSlop={8}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: isWeb ? 420 : 460 }} bounces={false}>
              {options.map((opt) => {
                const active = opt.id === value;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => { onChange(opt.id); setOpen(false); }}
                    style={({ hovered, pressed }) => [{ flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: SPACING.lg,
                      paddingVertical: SPACING.md + 2,
                      backgroundColor: (active || pressed)
                        ? withAlpha(colors.accent, 'activeRow')
                        : (hovered ? withAlpha(colors.accent, 'subtle') : 'transparent'),
                    }, webCursor]}
                  >
                    {opt.icon ? (
                      <Feather
                        name={opt.icon}
                        size={18}
                        color={active ? colors.accent : colors.textSecondary}
                        style={{ marginHorizontal: SPACING.sm }}
                      />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={[textStyles.body, {
                        color: active ? colors.accent : colors.text,
                        fontWeight: active ? '600' : '400',
                        textAlign: getTextAlign('left'),
                      }]}>
                        {opt.label}
                      </Text>
                      {opt.sublabel ? (
                        <Text style={[textStyles.caption, {
                          color: colors.textSecondary,
                          marginTop: 2,
                          textAlign: getTextAlign('left'),
                        }]}>
                          {opt.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    {active ? <Feather name="check" size={20} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
