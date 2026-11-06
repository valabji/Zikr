import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const native = requireOptionalNativeModule('ExpoExactAlarm');

export function canScheduleExactAlarms() {
  if (Platform.OS !== 'android' || Platform.Version < 31) return true;
  return native?.canScheduleExactAlarms() ?? false;
}
