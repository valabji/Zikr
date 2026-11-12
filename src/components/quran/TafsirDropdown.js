import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { t } from '@/locales/i18n';
import { SPACING, RADIUS, withAlpha, webCursor } from '@/constants/settingsTokens';
import { TAFSIRS, DEFAULT_TAFSIR_ID } from '@/constants/QuranConstants';

const isWeb = Platform.OS === 'web';

const LANG_LABEL = {
  ar: { ar: 'عربي', en: 'Arabic' },
  en: { ar: 'إنجليزي', en: 'English' },
};

export default function TafsirDropdown({ tafsirId, onChange, compact = false }) {
  const colors = useColors();
  const { isRTL, getTextAlign, getDirectionalMixedSpacing } = useRTL();
  const [open, setOpen] = React.useState(false);
  const uiLang = isRTL ? 'ar' : 'en';
  const selected = TAFSIRS.find((tf) => tf.id === (tafsirId || DEFAULT_TAFSIR_ID)) || TAFSIRS[0];
  const selectedLabel = uiLang === 'ar' ? selected.nameAr : selected.nameEn;

  const triggerColor = compact ? colors.BYellow : colors.text;
  const triggerBorder = compact ? withAlpha(colors.BYellow, 'strong') : withAlpha(colors.accent, 'border');
  const triggerBg = compact ? 'transparent' : withAlpha(colors.accent, 'subtle');

  const grouped = ['ar', 'en'].map((lang) => ({
    lang,
    label: LANG_LABEL[lang][uiLang],
    items: TAFSIRS.filter((tf) => tf.lang === lang),
  }));

  const listData = [];
  for (const group of grouped) {
    listData.push({ type: 'header', lang: group.lang, label: group.label });
    for (const item of group.items) {
      listData.push({ type: 'item', ...item });
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: compact ? SPACING.xs + 2 : SPACING.md - 2,
          paddingHorizontal: compact ? SPACING.sm + 2 : SPACING.md,
          borderRadius: compact ? RADIUS.card : RADIUS.control,
          borderWidth: 1,
          borderColor: triggerBorder,
          backgroundColor: triggerBg,
        }, webCursor]}
      >
        <Text style={[textStyles.base, { color: triggerColor, fontSize: compact ? 12 : 14, flex: 1 }]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        {selected.source === 'api' && (
          <Feather name="wifi" size={compact ? 11 : 13} color={triggerColor} style={{ ...getDirectionalMixedSpacing({ marginLeft: SPACING.xs }), opacity: 0.7 }} />
        )}
        <Feather name="chevron-down" size={compact ? 14 : 18} color={triggerColor} style={getDirectionalMixedSpacing({ marginLeft: SPACING.sm - 2 })} />
      </TouchableOpacity>

      <Modal visible={open} animationType={isWeb ? 'fade' : 'slide'} transparent onRequestClose={() => setOpen(false)} statusBarTranslucent>
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
              maxHeight: '80%',
              backgroundColor: colors.surface,
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
                backgroundColor: withAlpha(colors.textSecondary, 'muted'),
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
              <Text style={[textStyles.header, { color: colors.text, flex: 1, fontSize: 16, textAlign: getTextAlign('left') }]}>
                {t('quran.tafsirSelection')}
              </Text>
              <Pressable onPress={() => setOpen(false)} style={[{ padding: 4 }, webCursor]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={listData}
              keyExtractor={(row, i) => row.type === 'header' ? `h-${row.lang}` : row.id}
              initialNumToRender={14}
              renderItem={({ item: row }) => {
                if (row.type === 'header') {
                  return (
                    <View style={{ paddingHorizontal: SPACING.lg + 2, paddingTop: SPACING.md + 2, paddingBottom: SPACING.xs + 2 }}>
                      <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, textAlign: getTextAlign('left') }]}>
                        {row.label}
                      </Text>
                    </View>
                  );
                }
                const active = row.id === (tafsirId || DEFAULT_TAFSIR_ID);
                const label = uiLang === 'ar' ? row.nameAr : row.nameEn;
                return (
                  <Pressable
                    onPress={() => { onChange(row.id); setOpen(false); }}
                    style={({ hovered, pressed }) => [{ flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: SPACING.md + 2,
                      paddingHorizontal: SPACING.lg + 2,
                      backgroundColor: (active || pressed)
                        ? withAlpha(colors.accent, 'activeRow')
                        : (hovered ? withAlpha(colors.accent, 'subtle') : 'transparent'),
                    }, webCursor]}
                  >
                    <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.text, flex: 1, textAlign: getTextAlign('left') }]} numberOfLines={1}>
                      {label}
                    </Text>
                    {row.source === 'api' && (
                      <Feather name="wifi" size={14} color={colors.textSecondary} style={{ ...getDirectionalMixedSpacing({ marginRight: SPACING.sm }), opacity: 0.7 }} />
                    )}
                    {active && <Feather name="check" size={18} color={colors.accent} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
