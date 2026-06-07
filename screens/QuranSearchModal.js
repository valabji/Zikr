import * as React from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';
import pagesData from '../assets/quran/data/pages.json';
import surahsData from '../assets/quran/data/surahs.json';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

let indexCache = null;
let pageMapCache = null;
async function getIndex() {
  if (!indexCache) {
    indexCache = require('../assets/quran/data/search_index.json');
  }
  return indexCache;
}
function getPageMap() {
  if (!pageMapCache) {
    pageMapCache = {};
    for (const pg of pagesData) {
      for (const a of pg.ayahs) {
        pageMapCache[`${a.surah}:${a.ayah}`] = { page: pg.page, text: a.text, surah: a.surah, ayah: a.ayah };
      }
    }
  }
  return pageMapCache;
}

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const TASHKEEL_RE = /[ً-ٰۖ-ۭ۟-ۥؐ-ؚ]/g;
const TATWEEL_RE = /ـ/g;
const NONLETTER_RE = /[^ء-يٱ-ە\s]/g;

function normalize(text) {
  let t = text.replace(TASHKEEL_RE, '').replace(TATWEEL_RE, '');
  t = t.replace(/[ٱآأإ]/g, 'ا');
  t = t.replace(/ى/g, 'ي');
  t = t.replace(/ة/g, 'ه');
  t = t.replace(NONLETTER_RE, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

export default function QuranSearchModal({ visible, onClose, onSelectAyah }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [indexReady, setIndexReady] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getIndex().then(() => {
      getPageMap();
      setIndexReady(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [visible]);

  React.useEffect(() => {
    if (!visible || !indexReady) return;
    const q = normalize(query);
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      const terms = q.split(' ').filter((w) => w.length >= 2);
      if (!terms.length) {
        setResults([]);
        return;
      }
      const idx = indexCache;
      let candidate = null;
      for (const term of terms) {
        const hits = new Set();
        for (const word in idx) {
          if (word.includes(term)) {
            for (const k of idx[word]) hits.add(k);
          }
        }
        candidate = candidate ? new Set([...candidate].filter((x) => hits.has(x))) : hits;
        if (candidate.size === 0) break;
      }
      const pm = getPageMap();
      const list = [...(candidate || [])]
        .slice(0, 200)
        .map((k) => pm[k])
        .filter(Boolean);
      setResults(list);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, indexReady, visible]);

  const renderResult = ({ item }) => {
    const surah = surahsData[item.surah - 1];
    const ref = lang === 'ar'
      ? `${surah.nameAr} ${toArabicDigits(item.surah)}:${toArabicDigits(item.ayah)}`
      : `${surah.nameEn} ${item.surah}:${item.ayah}`;
    return (
      <TouchableOpacity
        onPress={() => onSelectAyah(item)}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '22',
        }}
      >
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 13, marginBottom: 6 }]}>
          {ref} · {t('quran.pageNumber', { n: lang === 'ar' ? toArabicDigits(item.page) : item.page })}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 20,
            lineHeight: 38,
            color: colors.text,
            textAlign: 'right',
            writingDirection: 'rtl',
          }}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: ANDROID_STATUS_BAR }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '22',
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Feather name="x" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 10,
            marginHorizontal: 6,
          }}>
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 8,
                color: colors.text,
                fontSize: 16,
                textAlign: isRTL() ? 'right' : 'left',
              }}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Feather name="x-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 10 }]}>{t('quran.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.surah}:${item.ayah}`}
            renderItem={renderResult}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.length >= 2 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={[textStyles.base, { color: colors.textSecondary }]}>—</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
