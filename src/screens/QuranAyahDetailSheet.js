import * as React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Pressable, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, toArabicDigits } from '@/locales/i18n';
import { QURAN_CONSTANTS, TAFSIRS, DEFAULT_TAFSIR_ID } from '@/constants/QuranConstants';
import { setQuranSettings } from '@/utils/QuranSettings';
import { arForHafs } from '@/utils/mushafText';
import { BUNDLED_TAFSIR_DATA, fetchApiTafsir } from '@/utils/tafsirLoader';
import TafsirDropdown from '@/components/TafsirDropdown';
import pagesData from '@assets/quran/data/pages.json';
import surahsData from '@assets/quran/data/surahs.json';
import translationEn from '@assets/quran/data/translation_en.json';
import wordsData from '@assets/quran/data/words.json';
import QuranAudio from '@/utils/QuranAudio';

const { FONT_FAMILY } = QURAN_CONSTANTS;

const verseTextByKey = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseTextByKey[`${a.surah}:${a.ayah}`] = a.text;
  }
}

const TABS = ['translation', 'tafsir', 'wordByWord'];

function TabButton({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.accent : 'transparent',
      }}
    >
      <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.textSecondary, fontSize: 14 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuranAyahDetailSheet({ ayah, onClose, tafsirId, onShare }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [tab, setTab] = React.useState('translation');
  const [tafsirText, setTafsirText] = React.useState(null);
  const [tafsirLoading, setTafsirLoading] = React.useState(false);

  const effectiveTafsirId = tafsirId || DEFAULT_TAFSIR_ID;
  const key = ayah ? `${ayah.surah}:${ayah.ayah}` : null;

  React.useEffect(() => {
    if (!key) return;
    const config = TAFSIRS.find((tf) => tf.id === effectiveTafsirId);
    if (!config || config.source === 'bundle') {
      setTafsirText((BUNDLED_TAFSIR_DATA[effectiveTafsirId] || BUNDLED_TAFSIR_DATA.muyassar_ar)[key] ?? null);
      setTafsirLoading(false);
      return;
    }
    let cancelled = false;
    setTafsirLoading(true);
    setTafsirText(null);
    fetchApiTafsir(config.apiId, key).then((text) => {
      if (cancelled) return;
      setTafsirText(text);
      setTafsirLoading(false);
    });
    return () => { cancelled = true; };
  }, [key, effectiveTafsirId]);

  if (!ayah) return null;
  const surah = surahsData[ayah.surah - 1];
  const arabicText = arForHafs(verseTextByKey[key]);
  const translation = translationEn[key];
  const words = wordsData[key] || [];
  const activeTafsirConfig = TAFSIRS.find((tf) => tf.id === effectiveTafsirId);
  const tafsirDirection = activeTafsirConfig?.direction || 'rtl';

  return (
    <Modal visible={!!ayah} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlayBackground, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation && e.stopPropagation()}
          style={{ backgroundColor: colors.background, height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 12, paddingVertical: 10,
              borderBottomWidth: 1, borderBottomColor: colors.accent + '22',
            }}>
              <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
                <Feather name="chevron-down" size={26} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>
                  {lang === 'ar' ? surah.nameAr : surah.nameEn} ·{' '}
                  {lang === 'ar' ? toArabicDigits(ayah.surah) : ayah.surah}:
                  {lang === 'ar' ? toArabicDigits(ayah.ayah) : ayah.ayah}
                </Text>
              </View>
              {onShare ? (
                <TouchableOpacity onPress={() => onShare(ayah)} style={{ padding: 6 }}>
                  <Feather name="share-2" size={22} color={colors.accent} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => QuranAudio.playAyah(ayah.surah, ayah.ayah)} style={{ padding: 6 }}>
                <Feather name="play" size={24} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={{
              paddingVertical: 20, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: colors.accent + '22',
            }}>
              <Text
                style={{ fontFamily: FONT_FAMILY, fontSize: 26, lineHeight: 52, color: colors.text, textAlign: 'center', writingDirection: 'rtl' }}
                allowFontScaling={false}
              >
                {arabicText}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {TABS.map((k) => (
                <TabButton key={k} colors={colors} label={t(`quran.${k}`)} active={tab === k} onPress={() => setTab(k)} />
              ))}
            </View>

            {tab === 'tafsir' && (
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 10,
                borderBottomWidth: 1, borderBottomColor: colors.accent + '15',
              }}>
                <TafsirDropdown
                  tafsirId={effectiveTafsirId}
                  onChange={(id) => setQuranSettings({ tafsirId: id })}
                  compact
                />
              </View>
            )}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {tab === 'translation' && (
                <Text style={[textStyles.base, { color: colors.text, fontSize: 15, lineHeight: 24, textAlign: 'left', writingDirection: 'ltr' }]}>
                  {translation || '—'}
                </Text>
              )}
              {tab === 'tafsir' && (
                tafsirLoading ? (
                  <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
                ) : (
                  <Text style={[textStyles.base, { color: colors.text, fontSize: 15, lineHeight: 28, textAlign: tafsirDirection === 'rtl' ? 'right' : 'left', writingDirection: tafsirDirection }]}>
                    {tafsirText || t('quran.tafsirEmpty')}
                  </Text>
                )
              )}
              {tab === 'wordByWord' && (
                words.length === 0 ? (
                  <Text style={[textStyles.base, { color: colors.textSecondary, textAlign: 'center' }]}>
                    {t('quran.wbwEmpty')}
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {words.map((w, i) => (
                      <View key={i} style={{ margin: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surface, minWidth: 80, alignItems: 'center' }}>
                        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 22, color: colors.text }} allowFontScaling={false}>{arForHafs(w.ar)}</Text>
                        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>{w.en}</Text>
                      </View>
                    ))}
                  </View>
                )
              )}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
