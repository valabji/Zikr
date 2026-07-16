import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, toArabicDigits } from '@/locales/i18n';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { arForHafs } from '@/utils/mushafLayout';
import pagesData from '@assets/quran/data/pages.json';
import surahsData from '@assets/quran/data/surahs.json';

const { FONT_FAMILY } = QURAN_CONSTANTS;

const verseTextByKey = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseTextByKey[`${a.surah}:${a.ayah}`] = a.text;
  }
}

function ActionRow({ icon, label, onPress, colors, primary }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: primary ? colors.accent : colors.accent + '22',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Feather name={icon} size={18} color={primary ? colors.primaryDark : colors.accent} />
      </View>
      <Text style={[
        textStyles.subtitle,
        { color: colors.text, marginHorizontal: 14, flex: 1, fontSize: 15 },
      ]}>
        {label}
      </Text>
      <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function QuranAyahActionSheet({ ayah, onClose, onPlay, onFollow, onDetails, onShare }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';

  if (!ayah) return null;
  const key = `${ayah.surah}:${ayah.ayah}`;
  const surah = surahsData[ayah.surah - 1];
  const arabicText = arForHafs(verseTextByKey[key] || '');

  return (
    <Modal visible={!!ayah} animationType="slide" transparent onRequestClose={onClose}>
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
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <SafeAreaView>
            <View style={{
              alignItems: 'center',
              paddingTop: 8,
            }}>
              <View style={{
                width: 36, height: 4, borderRadius: 2,
                backgroundColor: colors.textSecondary + '88',
              }} />
            </View>
            <View style={{
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 10,
            }}>
              <Text style={[textStyles.base, { color: colors.accent, fontSize: 12, textAlign: 'center', marginBottom: 8 }]}>
                {lang === 'ar' ? surah.nameAr : surah.nameEn} ·{' '}
                {lang === 'ar' ? toArabicDigits(ayah.surah) : ayah.surah}:
                {lang === 'ar' ? toArabicDigits(ayah.ayah) : ayah.ayah}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 22,
                  lineHeight: 46,
                  color: colors.text,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                }}
              >
                {arabicText}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.accent + '22' }} />
            <ActionRow
              colors={colors}
              icon="play"
              label={t('quran.actionPlay')}
              onPress={() => { onPlay(ayah); onClose(); }}
              primary
            />
            <ActionRow
              colors={colors}
              icon="mic"
              label={t('quran.actionFollow')}
              onPress={() => { onFollow(ayah); onClose(); }}
            />
            <ActionRow
              colors={colors}
              icon="info"
              label={t('quran.actionDetails')}
              onPress={() => { onDetails(ayah); onClose(); }}
            />
            <ActionRow
              colors={colors}
              icon="share-2"
              label={t('quran.actionShare')}
              onPress={() => { onShare(ayah); onClose(); }}
            />
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: colors.accent + '22',
                marginTop: 4,
              }}
            >
              <Text style={[textStyles.subtitle, { color: colors.textSecondary, fontSize: 14 }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
