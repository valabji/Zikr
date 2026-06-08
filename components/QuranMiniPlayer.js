import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles } from '../constants/Fonts';
import { isRTL, t } from '../locales/i18n';
import { toArabicDigits } from '../utils/mushafLayout';
import QuranAudio from '../utils/QuranAudio';
import surahsData from '../assets/quran/data/surahs.json';
import { RECITERS, DEFAULT_RECITER_ID } from '../constants/QuranReciters';
import { AUDIO_PLAYBACK_SCOPES } from '../constants/QuranConstants';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

function Chip({ active, label, onPress, colors, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 5, paddingHorizontal: 10,
        marginRight: 6,
        borderRadius: 14, borderWidth: 1,
        borderColor: active ? colors.BYellow : colors.BYellow + '55',
        backgroundColor: active ? colors.BYellow + '22' : 'transparent',
      }}
    >
      {icon ? <Feather name={icon} size={13} color={colors.BYellow} style={{ marginRight: 4 }} /> : null}
      <Text style={[textStyles.base, { color: colors.BYellow, fontSize: 12 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function QuranMiniPlayer({ colors, audio, onClose }) {
  const [expanded, setExpanded] = React.useState(false);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    loadQuranSettings().then((s) => { if (!cancelled) setSettings(s); });
    const unsub = subscribeQuranSettings((s) => setSettings(s));
    return () => { cancelled = true; unsub(); };
  }, []);

  if (!audio.activeAyah) return null;

  const surah = surahById[audio.activeAyah.surah];
  const lang = isRTL() ? 'ar' : 'en';
  const label = `${lang === 'ar' ? surah.nameAr : surah.nameEn} · ${lang === 'ar' ? toArabicDigits(audio.activeAyah.ayah) : audio.activeAyah.ayah}`;

  const scope = settings?.audioPlaybackScope || 'ayah';
  const reciterId = settings?.reciterId || DEFAULT_RECITER_ID;
  const loopOn = !!settings?.loopEnabled;
  const update = (partial) => setQuranSettings(partial);

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.primaryDark,
      borderTopWidth: 1, borderTopColor: colors.accent + '44',
    }}>
      {expanded ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
          <Text style={[textStyles.subtitle, { color: colors.BYellow + 'cc', fontSize: 11, marginBottom: 4 }]}>
            {t('quran.reciter')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
            style={{ marginBottom: 8 }}
          >
            {RECITERS.map((r) => (
              <Chip
                key={r.id}
                colors={colors}
                label={lang === 'ar' ? r.nameAr : r.nameEn}
                active={r.id === reciterId}
                onPress={() => update({ reciterId: r.id })}
              />
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <Chip
              colors={colors}
              label={t('quran.audioScopeAyah')}
              active={scope === AUDIO_PLAYBACK_SCOPES.AYAH}
              onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.AYAH })}
            />
            <Chip
              colors={colors}
              label={t('quran.audioScopePage')}
              active={scope === AUDIO_PLAYBACK_SCOPES.PAGE}
              onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.PAGE })}
            />
            <Chip
              colors={colors}
              label={t('quran.audioScopeSurah')}
              active={scope === AUDIO_PLAYBACK_SCOPES.SURAH}
              onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.SURAH })}
            />
            <View style={{ flex: 1 }} />
            <Chip
              colors={colors}
              icon="repeat"
              label={t('quran.loop')}
              active={loopOn}
              onPress={() => update({ loopEnabled: !loopOn })}
            />
          </View>
        </View>
      ) : null}

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
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
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          accessibilityLabel={expanded ? t('quran.collapsePlayer') : t('quran.expandPlayer')}
          style={{ paddingHorizontal: 6 }}
        >
          <Feather name={expanded ? 'chevron-down' : 'chevron-up'} size={22} color={colors.BYellow} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 8 }}>
          <Feather name="x" size={22} color={colors.BYellow} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
