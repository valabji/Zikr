import * as React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, Modal, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL } from '@/locales/i18n';
import { QURAN_CONSTANTS, TAFSIRS, DEFAULT_TAFSIR_ID } from '@/constants/QuranConstants';
import { setQuranSettings } from '@/utils/QuranSettings';
import { arForHafs, pageAyahsForLayout } from '@/utils/mushafLayout';
import { BUNDLED_TAFSIR_DATA, fetchApiTafsir } from '@/utils/tafsirLoader';
import TafsirDropdown from '@/components/TafsirDropdown';
import { CONTENT_MAX_WIDTH, webCursor } from '@/constants/settingsTokens';
import pagesData from '@assets/quran/data/pages.json';
import surahsData from '@assets/quran/data/surahs.json';
import translationEn from '@assets/quran/data/translation_en.json';

const isWeb = Platform.OS === 'web';
const capped = isWeb ? { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } : null;

const { FONT_FAMILY } = QURAN_CONSTANTS;
const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
const verseTextByKey = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseTextByKey[`${a.surah}:${a.ayah}`] = a.text;
  }
}

const TABS = ['translation', 'tafsir'];

function TabButton({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: active ? colors.accent : 'transparent',
      }, webCursor]}
    >
      <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.textSecondary, fontSize: 14 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AyahRow({ ayah, tab, tafsirText, tafsirLoading, tafsirDirection, onPress, colors }) {
  const key = `${ayah.surah}:${ayah.ayah}`;
  const translation = translationEn[key];
  const surah = surahById[ayah.surah];

  return (
    <Pressable
      onPress={() => onPress({ surah: ayah.surah, ayah: ayah.ayah, page: null })}
      style={[{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.accent + '22' }, webCursor]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: colors.accent + '22',
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 11 }]} numberOfLines={1}>
            {ayah.surah}:{ayah.ayah}
          </Text>
        </View>
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12 }]}>
          {isRTL() ? surah?.nameAr : surah?.nameEn}
        </Text>
      </View>
      <Text
        style={{ fontFamily: FONT_FAMILY, fontSize: 18, lineHeight: 36, color: colors.text, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 }}
        allowFontScaling={false}
      >
        {arForHafs(ayah.text)}
      </Text>
      {tab === 'translation' && (
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'left', writingDirection: 'ltr' }]}>
          {translation || '—'}
        </Text>
      )}
      {tab === 'tafsir' && (
        tafsirLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        ) : (
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, lineHeight: 22, textAlign: tafsirDirection === 'rtl' ? 'right' : 'left', writingDirection: tafsirDirection }]}>
            {tafsirText ?? t('quran.tafsirEmpty')}
          </Text>
        )
      )}
    </Pressable>
  );
}

export default function QuranPageInfoSheet({ visible, onClose, currentPage, layoutFile, onSelectAyah, colors, tafsirId }) {
  const [tab, setTab] = React.useState('translation');
  const [tafsirTexts, setTafsirTexts] = React.useState({});
  const [tafsirLoading, setTafsirLoading] = React.useState(false);

  const effectiveTafsirId = tafsirId || DEFAULT_TAFSIR_ID;
  const pageAyahs = React.useMemo(
    () => pageAyahsForLayout(layoutFile, currentPage).map((a) => ({ ...a, text: verseTextByKey[`${a.surah}:${a.ayah}`] })),
    [layoutFile, currentPage],
  );

  React.useEffect(() => {
    if (tab !== 'tafsir' || !pageAyahs.length) return;
    const config = TAFSIRS.find((tf) => tf.id === effectiveTafsirId);

    if (!config || config.source === 'bundle') {
      const data = BUNDLED_TAFSIR_DATA[effectiveTafsirId] || BUNDLED_TAFSIR_DATA.muyassar_ar;
      const texts = {};
      for (const a of pageAyahs) {
        const k = `${a.surah}:${a.ayah}`;
        texts[k] = data[k] ?? null;
      }
      setTafsirTexts(texts);
      setTafsirLoading(false);
      return;
    }

    let cancelled = false;
    setTafsirLoading(true);
    setTafsirTexts({});
    Promise.all(
      pageAyahs.map((a) => {
        const k = `${a.surah}:${a.ayah}`;
        return fetchApiTafsir(config.apiId, k).then((text) => [k, text]);
      })
    ).then((pairs) => {
      if (cancelled) return;
      setTafsirTexts(Object.fromEntries(pairs));
      setTafsirLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, effectiveTafsirId, pageAyahs]);

  const firstSurah = pageAyahs.length ? surahById[pageAyahs[0].surah] : null;
  const headerTitle = firstSurah
    ? `${t('quran.pageNumber', { n: currentPage })} · ${isRTL() ? firstSurah.nameAr : firstSurah.nameEn}`
    : t('quran.pageNumber', { n: currentPage });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
              <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={[{ padding: 6 }, webCursor]}>
                <Feather name="chevron-down" size={26} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>
                  {headerTitle}
                </Text>
              </View>
              <View style={{ width: 38 }} />
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingBottom: 20 }, capped]}>
              {pageAyahs.map((ayah) => {
                const k = `${ayah.surah}:${ayah.ayah}`;
                const activeCfg = TAFSIRS.find((tf) => tf.id === effectiveTafsirId);
                return (
                  <AyahRow
                    key={k}
                    ayah={ayah}
                    tab={tab}
                    tafsirText={tafsirTexts[k] ?? null}
                    tafsirLoading={tafsirLoading}
                    tafsirDirection={activeCfg?.direction || 'rtl'}
                    onPress={onSelectAyah}
                    colors={colors}
                  />
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
