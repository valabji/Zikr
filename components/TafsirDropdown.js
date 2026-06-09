import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Pressable, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { TAFSIRS, DEFAULT_TAFSIR_ID } from '../constants/QuranConstants';

const LANG_LABEL = {
  ar: { ar: 'عربي', en: 'Arabic' },
  en: { ar: 'إنجليزي', en: 'English' },
};

export default function TafsirDropdown({ tafsirId, onChange, compact = false }) {
  const colors = useColors();
  const [open, setOpen] = React.useState(false);
  const uiLang = isRTL() ? 'ar' : 'en';
  const selected = TAFSIRS.find((tf) => tf.id === (tafsirId || DEFAULT_TAFSIR_ID)) || TAFSIRS[0];
  const selectedLabel = uiLang === 'ar' ? selected.nameAr : selected.nameEn;

  const triggerColor = compact ? colors.BYellow : colors.text;
  const triggerBorder = compact ? colors.BYellow + '55' : colors.accent + '44';
  const triggerBg = compact ? 'transparent' : colors.accent + '0a';

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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: compact ? 6 : 10,
          paddingHorizontal: compact ? 10 : 12,
          borderRadius: compact ? 14 : 8,
          borderWidth: 1,
          borderColor: triggerBorder,
          backgroundColor: triggerBg,
        }}
      >
        <Text style={[textStyles.base, { color: triggerColor, fontSize: compact ? 12 : 14, flex: 1 }]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        {selected.source === 'api' && (
          <Feather name="wifi" size={compact ? 11 : 13} color={triggerColor} style={{ marginLeft: 4, opacity: 0.7 }} />
        )}
        <Feather name="chevron-down" size={compact ? 14 : 18} color={triggerColor} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              maxHeight: '80%',
              backgroundColor: colors.background,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.accent + '33',
            }}
          >
            <SafeAreaView>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.accent + '22',
              }}>
                <Text style={[textStyles.header, { color: colors.text, flex: 1, fontSize: 16 }]}>
                  {t('quran.tafsirSelection')}
                </Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={listData}
                keyExtractor={(row, i) => row.type === 'header' ? `h-${row.lang}` : row.id}
                initialNumToRender={14}
                renderItem={({ item: row }) => {
                  if (row.type === 'header') {
                    return (
                      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
                        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12 }]}>
                          {row.label}
                        </Text>
                      </View>
                    );
                  }
                  const active = row.id === (tafsirId || DEFAULT_TAFSIR_ID);
                  const label = uiLang === 'ar' ? row.nameAr : row.nameEn;
                  return (
                    <TouchableOpacity
                      onPress={() => { onChange(row.id); setOpen(false); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.accent + '15',
                        backgroundColor: active ? colors.accent + '12' : 'transparent',
                      }}
                    >
                      <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.text, flex: 1 }]} numberOfLines={1}>
                        {label}
                      </Text>
                      {row.source === 'api' && (
                        <Feather name="wifi" size={14} color={colors.textSecondary} style={{ marginRight: 8, opacity: 0.7 }} />
                      )}
                      {active && <Feather name="check" size={18} color={colors.accent} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
