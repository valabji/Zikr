import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Pressable, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { RECITERS, getReciter } from '../constants/QuranReciters';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

export default function QuranReciterPicker({ colors, reciterId, onChange, compact = false }) {
  const [open, setOpen] = React.useState(false);
  const lang = isRTL() ? 'ar' : 'en';
  const selected = getReciter(reciterId);
  const selectedLabel = lang === 'ar' ? selected.nameAr : selected.nameEn;

  const triggerColor = compact ? colors.BYellow : colors.text;
  const triggerBorder = compact ? colors.BYellow + '55' : colors.accent + '44';
  const triggerBg = compact ? 'transparent' : colors.accent + '0a';

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
        <Text
          style={[textStyles.base, { color: triggerColor, fontSize: compact ? 12 : 14, flex: 1 }]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
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
              paddingTop: ANDROID_STATUS_BAR ? 0 : 0,
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
                  {t('quran.reciter')}
                </Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={RECITERS}
                keyExtractor={(r) => r.id}
                initialNumToRender={20}
                renderItem={({ item }) => {
                  const active = item.id === reciterId;
                  const label = lang === 'ar' ? item.nameAr : item.nameEn;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
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
                      {active ? <Feather name="check" size={18} color={colors.accent} /> : null}
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
