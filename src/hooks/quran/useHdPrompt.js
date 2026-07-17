import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMushafEdition } from '@/constants/QuranConstants';
import QcfDownloader from '@/utils/quran/QcfDownloader';

const HD_SIZE_LABEL = { v1: '~95 MB', v2: '~208 MB', v4: '~167 MB' };
const HD_PROMPT_DISMISSED_KEY = (v) => `@quran_hd_prompt_dismissed_${v}`;

// One-time HD-fonts nudge per QCF version that isn't installed
export function useHdPrompt({ ready, settings, qcfState, onOpenSettings }) {
  const [hdPromptVersion, setHdPromptVersion] = React.useState(null);

  React.useEffect(() => {
    if (!ready) return;
    const v = getMushafEdition(settings.mushafEdition).qcfVersion;
    const s = qcfState[v];
    if (!s || s.installed || s.downloading) {
      setHdPromptVersion(null);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(HD_PROMPT_DISMISSED_KEY(v)).then((flag) => {
      if (cancelled || flag === '1') return;
      const timer = setTimeout(() => {
        if (!cancelled) setHdPromptVersion(v);
      }, 1200);
      return () => clearTimeout(timer);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [ready, settings.mushafEdition, qcfState]);

  const handleHdPromptDownload = React.useCallback((dontAskAgain) => {
    const v = hdPromptVersion;
    setHdPromptVersion(null);
    if (!v) return;
    if (dontAskAgain) {
      AsyncStorage.setItem(HD_PROMPT_DISMISSED_KEY(v), '1').catch(() => {});
    }
    QcfDownloader.start(v).catch(() => {});
    onOpenSettings();
  }, [hdPromptVersion, onOpenSettings]);

  const handleHdPromptDismiss = React.useCallback((dontAskAgain) => {
    const v = hdPromptVersion;
    setHdPromptVersion(null);
    if (v && dontAskAgain) {
      AsyncStorage.setItem(HD_PROMPT_DISMISSED_KEY(v), '1').catch(() => {});
    }
  }, [hdPromptVersion]);

  return {
    hdPromptVersion,
    hdSizeLabel: HD_SIZE_LABEL[hdPromptVersion] || '',
    handleHdPromptDownload,
    handleHdPromptDismiss,
  };
}
