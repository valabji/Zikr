import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { textStyles } from '@/constants/Fonts';
import { isRTL, t, toArabicDigits } from '@/locales/i18n';
import QuranVoiceFollower from '@/utils/quran/QuranVoiceFollower';
import surahsData from '@assets/quran/data/surahs.json';

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

export default function QuranVoiceFollowBar({ colors, voice }) {
  const insets = useSafeAreaInsets();

  if (!voice.active || !voice.activeAyah) return null;

  const surah = surahById[voice.activeAyah.surah];
  const lang = isRTL() ? 'ar' : 'en';
  const label = `${lang === 'ar' ? surah.nameAr : surah.nameEn} · ${lang === 'ar' ? toArabicDigits(voice.activeAyah.ayah) : voice.activeAyah.ayah}`;

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.primaryDark,
      borderTopWidth: 1, borderTopColor: colors.accent + '44',
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 + insets.bottom,
      }}>
        <Feather name="mic" size={16} color={voice.paused ? colors.BYellow + '88' : colors.BYellow} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.subtitle, { color: colors.BYellow, fontSize: 14 }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[textStyles.base, { color: colors.BYellow + 'aa', fontSize: 11 }]} numberOfLines={1}>
            {voice.paused ? t('quran.voicePaused') : t('quran.voiceFollowActive')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => (voice.paused ? QuranVoiceFollower.resume() : QuranVoiceFollower.pause())}
          accessibilityLabel={voice.paused ? t('quran.voiceResume') : t('quran.voicePause')}
          style={{ paddingHorizontal: 10 }}
        >
          <Feather name={voice.paused ? 'play' : 'pause'} size={26} color={colors.BYellow} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => QuranVoiceFollower.stop()}
          accessibilityLabel={t('quran.voiceStop')}
          style={{ paddingHorizontal: 8 }}
        >
          <Feather name="x" size={22} color={colors.BYellow} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
