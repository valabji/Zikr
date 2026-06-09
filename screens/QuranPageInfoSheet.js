import * as React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';
import pagesData from '../assets/quran/data/pages.json';
import surahsData from '../assets/quran/data/surahs.json';
import translationEn from '../assets/quran/data/translation_en.json';
import tafsirAr from '../assets/quran/data/tafsir_ar.json';

const { FONT_FAMILY } = QURAN_CONSTANTS;
const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

const TABS = ['translation', 'tafsir'];

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

function AyahRow({ ayah, tab, onPress, colors }) {
  const key = `${ayah.surah}:${ayah.ayah}`;
  const translation = translationEn[key];
  const tafsir = tafsirAr[key];
  const surah = surahById[ayah.surah];

  return (
    <Pressable
      onPress={() => onPress({ surah: ayah.surah, ayah: ayah.ayah, page: null })}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.accent + '22',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.accent + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
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
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 18,
          lineHeight: 36,
          color: colors.text,
          textAlign: 'right',
          writingDirection: 'rtl',
          marginBottom: 6,
        }}
        allowFontScaling={false}
      >
        {ayah.text}
      </Text>
      {tab === 'translation' && (
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'left', writingDirection: 'ltr' }]}>
          {translation || '—'}
        </Text>
      )}
      {tab === 'tafsir' && (
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' }]}>
          {tafsir || t('quran.tafsirEmpty')}
        </Text>
      )}
    </Pressable>
  );
}

export default function QuranPageInfoSheet({ visible, onClose, currentPage, onSelectAyah, colors }) {
  const [tab, setTab] = React.useState('translation');

  const pageData = pagesData[currentPage - 1];
  const firstSurah = pageData ? surahById[pageData.ayahs[0].surah] : null;
  const headerTitle = firstSurah
    ? `${t('quran.pageNumber', { n: currentPage })} · ${isRTL() ? firstSurah.nameAr : firstSurah.nameEn}`
    : t('quran.pageNumber', { n: currentPage });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.overlayBackground,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation && e.stopPropagation()}
          style={{
            backgroundColor: colors.background,
            maxHeight: '85%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <SafeAreaView>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.accent + '22',
            }}>
              <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
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
                <TabButton
                  key={k}
                  colors={colors}
                  label={t(`quran.${k}`)}
                  active={tab === k}
                  onPress={() => setTab(k)}
                />
              ))}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {pageData && pageData.ayahs.map((ayah) => (
                <AyahRow
                  key={`${ayah.surah}:${ayah.ayah}`}
                  ayah={ayah}
                  tab={tab}
                  onPress={onSelectAyah}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
