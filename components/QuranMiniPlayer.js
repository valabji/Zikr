import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles } from '../constants/Fonts';
import { isRTL } from '../locales/i18n';
import { toArabicDigits } from '../utils/mushafLayout';
import QuranAudio from '../utils/QuranAudio';
import surahsData from '../assets/quran/data/surahs.json';

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

export default function QuranMiniPlayer({ colors, audio, onClose }) {
  if (!audio.activeAyah) return null;
  const surah = surahById[audio.activeAyah.surah];
  const lang = isRTL() ? 'ar' : 'en';
  const label = `${lang === 'ar' ? surah.nameAr : surah.nameEn} · ${lang === 'ar' ? toArabicDigits(audio.activeAyah.ayah) : audio.activeAyah.ayah}`;
  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.primaryDark,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: colors.accent + '44',
    }}>
      <Text style={[textStyles.subtitle, { color: colors.BYellow, flex: 1, fontSize: 14 }]} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity onPress={() => QuranAudio.previous()} style={{ paddingHorizontal: 6 }}>
        <Feather name="skip-back" size={22} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => QuranAudio.toggle()} style={{ paddingHorizontal: 10 }}>
        <Feather name={audio.isPlaying ? 'pause' : 'play'} size={26} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => QuranAudio.next()} style={{ paddingHorizontal: 6 }}>
        <Feather name="skip-forward" size={22} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 8 }}>
        <Feather name="x" size={22} color={colors.BYellow} />
      </TouchableOpacity>
    </View>
  );
}
