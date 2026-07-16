import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { t } from '@/locales/i18n';

export function useUnsavedChangesGuard(navigation, hasUnsavedChanges, onSave) {
  const skipGuardRef = useRef(false);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (skipGuardRef.current || !hasUnsavedChanges()) return;
      e.preventDefault();
      Alert.alert(
        t('common.unsavedChanges'),
        t('common.unsavedChangesMessage'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          { text: t('common.discard'), style: 'destructive', onPress: () => {
            skipGuardRef.current = true;
            navigation.dispatch(e.data.action);
          } },
          { text: t('common.save'), style: 'default', onPress: async () => {
            if (await onSave()) {
              skipGuardRef.current = true;
              navigation.dispatch(e.data.action);
            }
          } },
        ]
      );
    });
  }, [navigation, hasUnsavedChanges, onSave]);

  return { skipGuard: () => { skipGuardRef.current = true; } };
}
