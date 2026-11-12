import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import service from '@/utils/notifications/NotificationService';
import { showDownloadProgress } from '@/utils/quran/quranDownloadNotifications';

const originalOS = Platform.OS;
afterEach(() => { Platform.OS = originalOS; });
beforeEach(() => { jest.clearAllMocks(); });

it.each(['short', 'none'])('routes Android %s alarms through the trigger channel', async (sound) => {
  Platform.OS = 'android';
  await service.scheduleExactNotification('alarm', 'Title', 'Body', new Date(Date.now() + 60000), sound);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    trigger: expect.objectContaining({ channelId: sound === 'none' ? 'prayer_silent' : 'prayer_adhan' }),
  }));
});

it('uses the low-importance download channel for immediate Android notifications', async () => {
  Platform.OS = 'android';
  await showDownloadProgress('download', 'Title', 'Body');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    trigger: { channelId: 'quran_downloads' },
  }));
});

it('keeps immediate iOS notifications channel-free', async () => {
  Platform.OS = 'ios';
  await showDownloadProgress('download', 'Title', 'Body');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: null }));
});

it('rejects an invalid Date before cancelling an existing alarm', async () => {
  expect(await service.scheduleExactNotification('alarm', 'Title', 'Body', new Date(NaN))).toBeNull();
  expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('removes old listeners when notification setup runs again', () => {
  const removeReceived = jest.fn();
  const removeResponse = jest.fn();
  Notifications.addNotificationReceivedListener.mockReturnValueOnce({ remove: removeReceived });
  Notifications.addNotificationResponseReceivedListener.mockReturnValueOnce({ remove: removeResponse });
  service.setupNotificationListener();
  service.setupNotificationListener();
  expect(removeReceived).toHaveBeenCalledTimes(1);
  expect(removeResponse).toHaveBeenCalledTimes(1);
});
