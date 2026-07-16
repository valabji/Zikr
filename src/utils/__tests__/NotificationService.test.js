// Unmock the global Sounds mock — we want NotificationService to call the real-ish wrapper.
// We mock expo-notifications + expo-intent-launcher directly.

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('scheduled-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getPresentedNotificationsAsync: jest.fn().mockResolvedValue([]),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidNotificationPriority: { HIGH: 'high', LOW: 'low' },
  AndroidImportance: { MAX: 5, LOW: 2 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn().mockResolvedValue(undefined),
  ActivityAction: {
    APPLICATION_DETAILS_SETTINGS: 'app_details_settings',
    IGNORE_BATTERY_OPTIMIZATION_SETTINGS: 'ignore_battery_opt',
  },
}));

// Replace the global ./utils/Sounds mock with one matching the new API
jest.mock('@/utils/Sounds', () => ({
  __esModule: true,
  default: {
    playNotificationSound: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Sounds from '@/utils/Sounds';
import service from '@/utils/NotificationService';

// Helper to swap Platform.OS + Version for a single test
const setPlatform = (os, version) => {
  global.Platform.OS = os;
  global.Platform.Version = version;
};

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations after clearAllMocks wipes them
    Notifications.setNotificationChannelAsync.mockResolvedValue(undefined);
    Notifications.deleteNotificationChannelAsync.mockResolvedValue(undefined);
    Notifications.scheduleNotificationAsync.mockResolvedValue('scheduled-id');
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    Notifications.getPresentedNotificationsAsync.mockResolvedValue([]);
    Notifications.dismissNotificationAsync.mockResolvedValue(undefined);
    IntentLauncher.startActivityAsync.mockResolvedValue(undefined);
    Sounds.playNotificationSound.mockResolvedValue(undefined);
    // Reset Platform to iOS by default
    setPlatform('ios', 15);
  });

  afterAll(() => {
    setPlatform('ios', undefined);
  });

  describe('initialize()', () => {
    it('sets a notification handler and wires up listeners', async () => {
      await service.initialize();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      const handlerArg = Notifications.setNotificationHandler.mock.calls[0][0];
      const handlerResult = await handlerArg.handleNotification();
      expect(handlerResult).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false, // CRITICAL: must be false so custom audio plays alone
        shouldSetBadge: true,
      });
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('suppresses the foreground banner for the live download notification', async () => {
      await service.initialize();
      const handlerArg = Notifications.setNotificationHandler.mock.calls[0][0];
      const result = await handlerArg.handleNotification({
        request: { content: { data: { type: 'quran-download' } } },
      });
      expect(result.shouldShowBanner).toBe(false);
      expect(result.shouldSetBadge).toBe(false);
      expect(result.shouldShowList).toBe(true);
    });

    it('does NOT create Android channels on iOS', async () => {
      setPlatform('ios', 15);
      await service.initialize();
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('creates the prayer channels on Android with correct importance and bundled adhan', async () => {
      setPlatform('android', 33);
      await service.initialize();
      const calls = Notifications.setNotificationChannelAsync.mock.calls;
      const adhan = calls.find(([id]) => id === 'prayer_adhan');
      const silent = calls.find(([id]) => id === 'prayer_silent');
      const countdown = calls.find(([id]) => id === 'prayer-countdown');
      expect(adhan).toBeDefined();
      expect(silent).toBeDefined();
      expect(countdown).toBeDefined();
      expect(adhan[1].importance).toBe(Notifications.AndroidImportance.MAX);
      expect(adhan[1].sound).toBe('adhan_alert.wav');
      expect(silent[1].sound).toBeNull();
      expect(countdown[1].importance).toBe(Notifications.AndroidImportance.LOW);
      // The immutable legacy channel is removed so its system-sound fallback can't linger.
      expect(Notifications.deleteNotificationChannelAsync).toHaveBeenCalledWith('prayer_reminders');
    });
  });

  describe('notification listeners', () => {
    it('plays short alert (auto-play) when notification is received in foreground', async () => {
      await service.initialize();
      const onReceived = Notifications.addNotificationReceivedListener.mock.calls.at(-1)[0];
      await onReceived({
        request: { identifier: 'fajr', content: { data: { soundType: 'short' } } },
      });
      expect(Sounds.playNotificationSound).toHaveBeenCalledWith('short', false);
    });

    it('plays full adhan when the user taps a notification', async () => {
      await service.initialize();
      const onTap = Notifications.addNotificationResponseReceivedListener.mock.calls.at(-1)[0];
      await onTap({
        notification: { request: { identifier: 'isha', content: { data: { soundType: 'full' } } } },
      });
      expect(Sounds.playNotificationSound).toHaveBeenCalledWith('full', true);
    });

    it('ignores notifications without a soundType', async () => {
      await service.initialize();
      const onReceived = Notifications.addNotificationReceivedListener.mock.calls.at(-1)[0];
      await onReceived({
        request: { identifier: 'no-sound', content: { data: {} } },
      });
      expect(Sounds.playNotificationSound).not.toHaveBeenCalled();
    });
  });

  describe('requestPermissions()', () => {
    it('returns granted=true on iOS when status is already granted', async () => {
      setPlatform('ios', 15);
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted', granted: true });
      const result = await service.requestPermissions();
      expect(result.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when not yet granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const result = await service.requestPermissions();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result.granted).toBe(true);
    });

    it('returns granted=false with a user-friendly message when denied', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const result = await service.requestPermissions();
      expect(result.granted).toBe(false);
      expect(result.message).toMatch(/denied/i);
    });

    it('flags needsExactAlarm when granted on Android 12+ without exact alarm', async () => {
      setPlatform('android', 33);
      // First call: notification permission check during requestPermissions
      Notifications.getPermissionsAsync
        .mockResolvedValueOnce({ status: 'granted', granted: true })
        // Second call: inside checkExactAlarmPermission
        .mockResolvedValueOnce({ granted: false });
      const result = await service.requestPermissions();
      expect(result).toMatchObject({
        granted: true,
        exactAlarmGranted: false,
        needsExactAlarm: true,
      });
    });

    it('returns full success when Android exact alarm is granted', async () => {
      setPlatform('android', 33);
      Notifications.getPermissionsAsync
        .mockResolvedValueOnce({ status: 'granted', granted: true })
        .mockResolvedValueOnce({ granted: true });
      const result = await service.requestPermissions();
      expect(result).toMatchObject({ granted: true, exactAlarmGranted: true });
    });

    it('captures errors and returns granted=false', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.getPermissionsAsync.mockRejectedValue(new Error('boom'));
      const result = await service.requestPermissions();
      expect(result.granted).toBe(false);
      expect(result.error).toBe('boom');
      spy.mockRestore();
    });
  });

  describe('checkExactAlarmPermission()', () => {
    it('returns true on iOS', async () => {
      setPlatform('ios', 15);
      await expect(service.checkExactAlarmPermission()).resolves.toBe(true);
    });

    it('returns true on Android < 12 even without explicit permission', async () => {
      setPlatform('android', 30);
      await expect(service.checkExactAlarmPermission()).resolves.toBe(true);
    });

    it('checks notification permission on Android 12+', async () => {
      setPlatform('android', 33);
      Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
      await expect(service.checkExactAlarmPermission()).resolves.toBe(true);
    });

    it('returns false on Android 12+ when notification permission missing', async () => {
      setPlatform('android', 33);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Notifications.getPermissionsAsync.mockResolvedValue({ granted: false });
      await expect(service.checkExactAlarmPermission()).resolves.toBe(false);
      warn.mockRestore();
    });

    it('returns false on error', async () => {
      setPlatform('android', 33);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.getPermissionsAsync.mockRejectedValue(new Error('boom'));
      await expect(service.checkExactAlarmPermission()).resolves.toBe(false);
      spy.mockRestore();
    });
  });

  describe('openExactAlarmSettings()', () => {
    it('on iOS, alerts that it is not required and does not launch any intent', async () => {
      setPlatform('ios', 15);
      await service.openExactAlarmSettings();
      expect(Alert.alert).toHaveBeenCalledWith('Not Required', expect.any(String));
      expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
    });

    it('on Android 12+ launches REQUEST_SCHEDULE_EXACT_ALARM intent', async () => {
      setPlatform('android', 33);
      await service.openExactAlarmSettings();
      expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
        'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
        expect.objectContaining({ data: 'package:com.valabji.zikr' })
      );
    });

    it('on Android < 12 alerts that it is not required', async () => {
      setPlatform('android', 30);
      await service.openExactAlarmSettings();
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('falls back to app details settings when exact alarm intent fails', async () => {
      setPlatform('android', 33);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      IntentLauncher.startActivityAsync
        .mockRejectedValueOnce(new Error('no such activity'))
        .mockResolvedValueOnce(undefined);
      await service.openExactAlarmSettings();
      expect(IntentLauncher.startActivityAsync).toHaveBeenCalledTimes(2);
      expect(IntentLauncher.startActivityAsync.mock.calls[1][0]).toBe(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS
      );
      spy.mockRestore();
    });

    it('alerts an error when both intents fail', async () => {
      setPlatform('android', 33);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      IntentLauncher.startActivityAsync.mockRejectedValue(new Error('no'));
      await service.openExactAlarmSettings();
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      spy.mockRestore();
    });
  });

  describe('checkBatteryOptimization()', () => {
    it('returns false on iOS', async () => {
      setPlatform('ios', 15);
      await expect(service.checkBatteryOptimization()).resolves.toBe(false);
    });

    it('seeds lastBatteryCheck on first call and returns false', async () => {
      setPlatform('android', 33);
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();
      await expect(service.checkBatteryOptimization()).resolves.toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastBatteryCheck', expect.any(String));
    });

    it('returns true if more than 24h have elapsed since last check', async () => {
      setPlatform('android', 33);
      const twoDaysAgo = Date.now() - 1000 * 60 * 60 * 48;
      AsyncStorage.getItem.mockResolvedValue(String(twoDaysAgo));
      await expect(service.checkBatteryOptimization()).resolves.toBe(true);
    });

    it('returns false if last check was recent', async () => {
      setPlatform('android', 33);
      AsyncStorage.getItem.mockResolvedValue(String(Date.now() - 1000));
      await expect(service.checkBatteryOptimization()).resolves.toBe(false);
    });

    it('returns false on storage error', async () => {
      setPlatform('android', 33);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
      await expect(service.checkBatteryOptimization()).resolves.toBe(false);
      spy.mockRestore();
    });
  });

  describe('openBatterySettings()', () => {
    it('on iOS alerts not applicable', async () => {
      setPlatform('ios', 15);
      await service.openBatterySettings();
      expect(Alert.alert).toHaveBeenCalledWith('Not Applicable', expect.any(String));
      expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
    });

    it('on Android opens IGNORE_BATTERY_OPTIMIZATION_SETTINGS and shows guidance', async () => {
      setPlatform('android', 33);
      await service.openBatterySettings();
      expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('falls back when battery settings intent fails', async () => {
      setPlatform('android', 33);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      IntentLauncher.startActivityAsync
        .mockRejectedValueOnce(new Error('no'))
        .mockResolvedValueOnce(undefined);
      await service.openBatterySettings();
      expect(IntentLauncher.startActivityAsync).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });
  });

  describe('scheduleExactNotification()', () => {
    it('returns null and logs error for a past trigger date', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const past = new Date(Date.now() - 60_000);
      const result = await service.scheduleExactNotification('fajr', 'T', 'B', past);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('returns null when triggerDate is not a Date instance', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.scheduleExactNotification('fajr', 'T', 'B', 'not-a-date');
      expect(result).toBeNull();
      spy.mockRestore();
    });

    it('cancels any existing notification with the same id before scheduling', async () => {
      const future = new Date(Date.now() + 60_000);
      await service.scheduleExactNotification('fajr', 'Fajr', 'Time', future, 'short');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('fajr');
    });

    it('schedules with the bundled adhan sound and adhan channel for audible modes', async () => {
      setPlatform('android', 33);
      const future = new Date(Date.now() + 60_000);
      Notifications.scheduleNotificationAsync.mockResolvedValue('id-123');
      const id = await service.scheduleExactNotification('fajr', 'Fajr', 'Time', future, 'full');
      expect(id).toBe('id-123');
      const call = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.sound).toBe('adhan_alert.wav');
      expect(call.content.channelId).toBe('prayer_adhan');
      expect(call.content.data).toMatchObject({
        notificationId: 'fajr',
        soundType: 'full',
      });
      expect(call.trigger).toMatchObject({
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: future,
      });
      expect(call.content.priority).toBe(Notifications.AndroidNotificationPriority.HIGH);
    });

    it('schedules silently with no sound and the silent channel for none mode', async () => {
      setPlatform('android', 33);
      const future = new Date(Date.now() + 60_000);
      await service.scheduleExactNotification('fajr', 'Fajr', 'Time', future, 'none');
      const call = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.sound).toBeNull();
      expect(call.content.channelId).toBe('prayer_silent');
      expect(call.content.data.soundType).toBe('none');
    });

    it('returns null when expo-notifications throws', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('boom'));
      const future = new Date(Date.now() + 60_000);
      const result = await service.scheduleExactNotification('fajr', 'T', 'B', future);
      expect(result).toBeNull();
      spy.mockRestore();
    });
  });

  describe('cancelNotification()', () => {
    it('cancels by identifier', async () => {
      await service.cancelNotification('fajr');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('fajr');
    });

    it('logs errors but does not throw', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('no'));
      await expect(service.cancelNotification('x')).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('cancelAllNotifications()', () => {
    it('calls expo-notifications cancelAll', async () => {
      await service.cancelAllNotifications();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('logs errors but does not throw', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.cancelAllScheduledNotificationsAsync.mockRejectedValue(new Error('no'));
      await expect(service.cancelAllNotifications()).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('getScheduledNotifications()', () => {
    it('returns the list from expo-notifications', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([{ id: 'fajr' }]);
      await expect(service.getScheduledNotifications()).resolves.toEqual([{ id: 'fajr' }]);
    });

    it('returns [] on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('no'));
      await expect(service.getScheduledNotifications()).resolves.toEqual([]);
      spy.mockRestore();
    });
  });

  describe('createNotificationChannel()', () => {
    it('is a no-op on iOS', async () => {
      setPlatform('ios', 15);
      await service.createNotificationChannel('x', 'X', 'desc');
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('creates the channel with MAX importance and DND bypass on Android', async () => {
      setPlatform('android', 33);
      await service.createNotificationChannel('prayer_reminders', 'Prayer Reminders', 'desc');
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'prayer_reminders',
        expect.objectContaining({
          importance: Notifications.AndroidImportance.MAX,
          bypassDnd: true,
          sound: null,
        })
      );
    });
  });

  describe('showPersistentCountdown / hidePersistentCountdown', () => {
    it('schedules a sticky notification with a stable identifier and the countdown channel on Android', async () => {
      setPlatform('android', 33);
      await service.showPersistentCountdown('🕌 Next Prayer', 'Fajr at 5:30 AM\n2h 15m remaining', 'fajr');

      const scheduleArg = Notifications.scheduleNotificationAsync.mock.calls.at(-1)[0];
      expect(scheduleArg.identifier).toBe('prayer-countdown-persistent');
      expect(scheduleArg.trigger).toBeNull();
      expect(scheduleArg.content.sticky).toBe(true);
      expect(scheduleArg.content.channelId).toBe('prayer-countdown');
      expect(scheduleArg.content.title).toBe('🕌 Next Prayer');
      expect(scheduleArg.content.body).toBe('Fajr at 5:30 AM\n2h 15m remaining');
      expect(scheduleArg.content.data.prayer).toBe('fajr');
    });

    it('does not set channelId on iOS but still schedules with stable id', async () => {
      setPlatform('ios', 15);
      await service.showPersistentCountdown('🕌 Next Prayer', 'body');
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
      const scheduleArg = Notifications.scheduleNotificationAsync.mock.calls.at(-1)[0];
      expect(scheduleArg.identifier).toBe('prayer-countdown-persistent');
      expect(scheduleArg.content.channelId).toBeUndefined();
    });

    it('logs but does not throw when scheduling fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('no'));
      await expect(service.showPersistentCountdown('title', 'body'))
        .resolves.toBeUndefined();
      spy.mockRestore();
    });

    it('hidePersistentCountdown dismisses the persistent notification', async () => {
      await service.hidePersistentCountdown();
      expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(
        'prayer-countdown-persistent'
      );
    });

    it('hidePersistentCountdown logs but does not throw on error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Notifications.dismissNotificationAsync.mockRejectedValue(new Error('no'));
      await expect(service.hidePersistentCountdown()).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });
});
