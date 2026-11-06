import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrayerSettingsSave } from '@/hooks/prayer/usePrayerSettingsSave';
import scheduler from '@/utils/prayer/PrayerNotificationScheduler';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

jest.mock('@/locales/i18n', () => ({ t: key => key }));
jest.mock('@/utils/prayer/PrayerNotificationScheduler', () => ({
  __esModule: true, default: { refresh: jest.fn() },
}));
jest.mock('@/utils/prayer/PrayerCountdownService', () => ({
  __esModule: true, default: { stop: jest.fn(), start: jest.fn() },
}));

it('reports failed reminder updates, then saves a time-zone correction on retry', async () => {
  jest.clearAllMocks();
  AsyncStorage.setItem.mockResolvedValue();
  scheduler.refresh.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const location = { latitude: 51.5, longitude: -0.12, timezone: 'Europe/London' };
  const selectedLocation = { ...location, timezone: 'Europe/Paris', timezoneOverride: true };
  const navigation = { addListener: jest.fn(() => () => {}), goBack: jest.fn() };
  const { result } = renderHook(() => usePrayerSettingsSave({
    navigation,
    selectedLocation,
    prayer: { location, setLocation: jest.fn(), calculationMethod: 'Egyptian', madhab: 'Shafi', loadPrayerSettings: jest.fn() },
    notif: { notificationsEnabled: true, audioMode: 'short', selectedAdhan: 'default', notificationTimes: { fajr: true }, showPersistentCountdown: false, loadNotificationSettings: jest.fn() },
  }));
  await act(async () => {});
  await act(async () => { await result.current.handleSave(); });
  expect(Alert.alert).toHaveBeenLastCalledWith('common.error', 'prayerSettings.remindersError');
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION, JSON.stringify(selectedLocation));
  await act(async () => { await result.current.handleSave(); });
  expect(Alert.alert).toHaveBeenLastCalledWith('common.success', 'prayerSettings.saveSuccess', expect.any(Array));
});

it.each(['pending', 'failed'])('does not overwrite saved settings when loading is %s', async outcome => {
  jest.clearAllMocks();
  let finish;
  const loading = new Promise((resolve, reject) => {
    finish = () => outcome === 'failed' ? reject(new Error('unavailable')) : resolve();
  });
  const { result } = renderHook(() => usePrayerSettingsSave({
    navigation: { addListener: jest.fn(() => () => {}), goBack: jest.fn() },
    selectedLocation: { latitude: 51.5, longitude: -0.12, timezone: 'Europe/London' },
    prayer: { location: null, setLocation: jest.fn(), calculationMethod: 'Egyptian', madhab: 'Shafi', loadPrayerSettings: () => loading },
    notif: { notificationsEnabled: false, audioMode: 'short', selectedAdhan: 'default', notificationTimes: {}, showPersistentCountdown: false, loadNotificationSettings: jest.fn() },
  }));
  expect(result.current.canSave).toBe(false);
  await act(async () => { await result.current.handleSave(); });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await act(async () => { finish(); });
  expect(result.current.canSave).toBe(outcome !== 'failed');
  if (outcome === 'failed') {
    await act(async () => { await result.current.handleSave(); });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'common.settingsLoadError');
  }
});
