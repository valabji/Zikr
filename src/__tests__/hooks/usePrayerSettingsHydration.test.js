import { renderHook, act } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrayerSettings } from '@/hooks/prayer/usePrayerSettings';
import { usePrayerNotificationSettings } from '@/hooks/prayer/usePrayerNotificationSettings';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import NotificationService from '@/utils/notifications/NotificationService';

jest.mock('@/utils/prayer/AdhanDownloader', () => ({
  __esModule: true, default: { checkInstalled: jest.fn(), subscribe: () => () => {} },
}));
jest.mock('@/utils/notifications/NotificationService', () => ({
  __esModule: true, default: { checkExactAlarmPermission: jest.fn().mockResolvedValue(true) },
}));

beforeEach(() => { jest.clearAllMocks(); AsyncStorage.getItem.mockResolvedValue(null); });

it('refreshes the exact-alarm grant when returning from Android settings', async () => {
  const previousOS = Platform.OS;
  Platform.OS = 'android';
  NotificationService.checkExactAlarmPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  try {
    const { result, unmount } = renderHook(usePrayerNotificationSettings);
    await act(async () => { await result.current.loadNotificationSettings(); });
    expect(result.current.hasExactAlarm).toBe(false);
    const onStateChange = AppState.addEventListener.mock.calls[0][1];
    await act(async () => { await onStateChange('active'); });
    expect(result.current.hasExactAlarm).toBe(true);
    unmount();
    expect(AppState.addEventListener.mock.results[0].value.remove).toHaveBeenCalled();
  } finally { Platform.OS = previousOS; }
});

it.each(['null', '[]', '{', '{"fajr":false,"isha":"false"}'])('recovers invalid or partial prayer toggles: %s', async (raw) => {
  AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.ENABLED_PRAYERS ? raw : null);
  const { result } = renderHook(usePrayerNotificationSettings);
  await act(async () => { await result.current.loadNotificationSettings(); });
  expect(result.current.notificationTimes).toEqual({
    fajr: raw.includes('"fajr":false') ? false : true, dhuhr: true, asr: true, maghrib: true, isha: true,
  });
});

it.each(['{', 'null', '[]', '{"latitude":91,"longitude":0}', '{"latitude":"0","longitude":0}'])('recovers invalid saved locations without losing calculation settings: %s', async raw => {
  AsyncStorage.getItem.mockImplementation(async key => ({
    [PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION]: raw,
    [PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD]: 'Egyptian',
    [PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB]: 'Hanafi',
  }[key] || null));
  const { result } = renderHook(usePrayerSettings);
  let loaded;
  await act(async () => { loaded = await result.current.loadPrayerSettings(); });
  expect(loaded.complete).toBe(false);
  expect(result.current.location).toBeNull();
  expect(result.current.calculationMethod).toBe('Egyptian');
});

it('accepts zero coordinates and clears a location removed from storage', async () => {
  AsyncStorage.getItem.mockImplementation(async key => key === PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION ? '{"latitude":0,"longitude":0}' : null);
  const { result } = renderHook(usePrayerSettings);
  await act(async () => { await result.current.loadPrayerSettings(); });
  expect(result.current.location).toEqual({ latitude: 0, longitude: 0, timezone: 'Etc/GMT' });
  AsyncStorage.getItem.mockResolvedValue(null);
  await act(async () => { await result.current.loadPrayerSettings(); });
  expect(result.current.location).toBeNull();
});
