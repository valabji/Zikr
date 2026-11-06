import { Platform } from 'react-native';

export const canScheduleExactAlarms = jest.fn(() => Platform.OS !== 'android' || Platform.Version < 31);
