import * as React from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '@/locales/i18n';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { setQuranSettings } from '@/utils/quran/QuranSettings';

const { STORAGE_KEYS } = QURAN_CONSTANTS;

export function useQuranAlerts({ settingsRef, customLineSize, onOpenSettings }) {
  const hdFallbackRef = React.useRef(false);
  React.useEffect(() => {
    if (!customLineSize) hdFallbackRef.current = false;
  }, [customLineSize]);
  const overflowWarnedRef = React.useRef(false);
  const qcfErrorWarnedRef = React.useRef(false);

  const handleLineOverflow = React.useCallback(({ hd }) => {
    if (hd) {
      if (hdFallbackRef.current || settingsRef.current.customLineSize) return;
      hdFallbackRef.current = true;
      setQuranSettings({ customLineSize: true });
      Alert.alert(t('quran.overflowHdTitle'), t('quran.overflowHdBody'));
      return;
    }
    if (overflowWarnedRef.current) return;
    overflowWarnedRef.current = true;
    AsyncStorage.getItem(STORAGE_KEYS.OVERFLOW_WARNED).then((flag) => {
      if (flag === '1') return;
      AsyncStorage.setItem(STORAGE_KEYS.OVERFLOW_WARNED, '1').catch(() => {});
      Alert.alert(t('quran.overflowWarnTitle'), t('quran.overflowWarnBody'), [
        { text: t('common.ok'), style: 'cancel' },
        { text: t('quran.overflowOpenSettings'), onPress: onOpenSettings },
      ]);
    }).catch(() => {});
  }, [onOpenSettings]);

  const handleQcfLoadError = React.useCallback(() => {
    if (qcfErrorWarnedRef.current) return;
    qcfErrorWarnedRef.current = true;
    Alert.alert(t('quran.qcfLoadFailedTitle'), t('quran.qcfLoadFailedBody'), [
      { text: t('common.ok'), style: 'cancel' },
      { text: t('quran.overflowOpenSettings'), onPress: onOpenSettings },
    ]);
  }, [onOpenSettings]);

  return { handleLineOverflow, handleQcfLoadError };
}
