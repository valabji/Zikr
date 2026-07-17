import * as React from 'react';
import { Alert } from 'react-native';
import { t, isRTL } from '@/locales/i18n';
import QuranAudio from '@/utils/quran/QuranAudio';
import QuranVoiceFollower from '@/utils/quran/QuranVoiceFollower';
import surahsData from '@assets/quran/data/surahs.json';

export function useQuranAudioState() {
  const [audioState, setAudioState] = React.useState({ activeAyah: null, isPlaying: false, playingWordIdx: null });
  const [voiceState, setVoiceState] = React.useState({ active: false, activeAyah: null, playingWordIdx: null, mistake: false, pendingPrompt: null });

  React.useEffect(() => {
    const unsubAudio = QuranAudio.subscribe((st) => {
      setAudioState({ activeAyah: st.activeAyah, isPlaying: st.isPlaying, playingWordIdx: st.playingWordIdx ?? null });
    });
    const unsubVoice = QuranVoiceFollower.subscribe((st) => setVoiceState(st));
    return () => {
      unsubAudio();
      unsubVoice();
      QuranAudio.stop();
      QuranVoiceFollower.stop();
    };
  }, []);

  const promptShownRef = React.useRef(null);
  React.useEffect(() => {
    const p = voiceState.pendingPrompt;
    if (!p) { promptShownRef.current = null; return; }
    if (promptShownRef.current === p) return;
    promptShownRef.current = p;
    const surah = surahsData[p.toSurah - 1];
    const name = surah ? (isRTL() ? surah.nameAr : surah.nameEn) : '';
    Alert.alert(
      t('quran.voiceMismatchTitle'),
      t('quran.voiceMismatchMessage', { to: `${name} ${p.toAyah}` }),
      [
        { text: t('quran.voiceMismatchLookAhead'), onPress: () => QuranVoiceFollower.resolvePrompt('lookahead') },
        { text: t('quran.voiceMismatchMistake'), onPress: () => QuranVoiceFollower.resolvePrompt('mistake') },
        { text: t('common.cancel'), style: 'cancel', onPress: () => QuranVoiceFollower.resolvePrompt('dismiss') },
      ],
      { cancelable: true, onDismiss: () => QuranVoiceFollower.resolvePrompt('dismiss') }
    );
  }, [voiceState.pendingPrompt]);

  return { audioState, voiceState };
}
