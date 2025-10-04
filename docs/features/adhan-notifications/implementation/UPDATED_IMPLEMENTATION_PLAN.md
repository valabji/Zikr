# UPDATED: Adhan Reminders Implementation Plan

**⚠️ This document supersedes the original `ADHAN_REMINDERS_IMPLEMENTATION.md`**

**Last Updated**: October 4, 2025  
**Status**: Ready for Implementation with Critical Adjustments  
**Review**: Based on React Native Developer Concerns Analysis

---

## 🔴 CRITICAL CHANGES FROM ORIGINAL PLAN

### Change 1: Audio Playback Strategy

**Original Plan**: Auto-play full adhan (60-120s) when notification arrives

**NEW PLAN**: 
- Play **short alert sound** (15-30s) in notification
- Play **full adhan** ONLY when user taps notification
- User must interact to hear complete adhan

**Reason**: iOS/Android platform limitations, App Store policies, battery optimization

### Change 2: Android Permissions

**Original Plan**: Basic notification permissions

**NEW PLAN**: Add exact alarm permissions for precise timing
```javascript
android: {
  permissions: [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.USE_EXACT_ALARM"
  ]
}
```

**Reason**: Android Doze mode delays notifications without exact alarm permission

### Change 3: iOS Configuration

**Original Plan**: Minimal iOS config

**NEW PLAN**: Comprehensive notification configuration
```javascript
ios: {
  infoPlist: {
    NSUserNotificationsUsageDescription: "Prayer time reminders with optional Adhan audio",
    UIBackgroundModes: ["audio", "remote-notification"]
  }
}
```

**Reason**: Required for notification permissions and audio playback

---

## Updated Task Breakdown

### ✅ Task 1: Setup Dependencies and Configuration (UPDATED)

**Changes from Original**:
- ✅ Added Android exact alarm permissions
- ✅ Added iOS notification permission strings
- ✅ Added UIBackgroundModes configuration
- ✅ Added prebuild backup procedure

**Acceptance Criteria** (Updated):
- expo-notifications installed (v0.28.19 for SDK 54)
- iOS NSUserNotificationsUsageDescription configured
- iOS UIBackgroundModes configured
- Android POST_NOTIFICATIONS permission added
- Android SCHEDULE_EXACT_ALARM permission added
- Android USE_EXACT_ALARM permission added (Android 14+)
- Native directories backed up before prebuild
- App builds successfully on both platforms

**Implementation Steps** (Updated):
1. **Backup first** (NEW):
   ```bash
   cp -r android android_backup
   cp -r ios ios_backup
   cp google-services.json google-services.json.backup
   git commit -m "Pre-notification-feature backup"
   ```

2. Install expo-notifications:
   ```bash
   yarn add expo-notifications@~0.28.19
   ```

3. Update `app.config.js` - iOS section:
   ```javascript
   ios: {
     bundleIdentifier: "com.valabji.zikr",
     googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
     supportsTablet: true,
     buildNumber: "15",
     infoPlist: {
       CFBundleAllowMixedLocalizations: true,
       // NEW: Notification permissions
       NSUserNotificationsUsageDescription: 
         "This app uses notifications to remind you of prayer times with the option to play Adhan audio.",
       // NEW: Background modes for audio
       UIBackgroundModes: ["audio", "remote-notification"]
     }
   }
   ```

4. Update `app.config.js` - Android section:
   ```javascript
   android: {
     permissions: [
       // ... existing permissions
       "android.permission.VIBRATE",
       
       // NEW: Notification permissions
       "android.permission.POST_NOTIFICATIONS",        // Android 13+
       "android.permission.SCHEDULE_EXACT_ALARM",      // For precise timing
       "android.permission.USE_EXACT_ALARM"            // Android 14+
     ]
   }
   ```

5. Run prebuild and verify:
   ```bash
   expo prebuild --clean
   ls -la android/app/google-services.json  # Verify exists
   ls -la ios/GoogleService-Info.plist      # Verify exists
   ```

6. Test builds:
   ```bash
   yarn android  # Test Android build
   yarn ios      # Test iOS build
   ```

7. Test permission requests on physical devices (NEW)

---

### ✅ Task 2: Add Adhan Audio Assets (UPDATED)

**Changes from Original**:
- ✅ Now requires TWO audio files (short + full)
- ✅ Added file size requirements
- ✅ Added compression guidelines

**Acceptance Criteria** (Updated):
- **Short alert audio** (15-30s, <400 KB) available
- **Full adhan audio** (60-120s, <1 MB) available
- Both files in MP3 format, 128kbps bitrate
- Both files play correctly using expo-audio
- Total audio size <1.5 MB
- Audio quality clear and appropriate

**File Structure** (NEW):
```
assets/sound/
  ├── adhan_short.mp3   (~300 KB) - Used in notifications
  ├── adhan_full.mp3    (~800 KB) - Used when user taps notification
  └── kikhires.mp3      (existing click sound)
```

**Implementation Steps** (Updated):
1. Obtain royalty-free adhan audio in high quality

2. Create short alert version (15-30s):
   ```bash
   # Extract first 30 seconds and compress
   ffmpeg -i original.wav -t 30 -codec:a libmp3lame -b:a 128k -ar 44100 adhan_short.mp3
   ```

3. Create full adhan version (60-120s):
   ```bash
   # Compress full adhan
   ffmpeg -i original.wav -codec:a libmp3lame -b:a 128k -ar 44100 adhan_full.mp3
   ```

4. Verify file sizes:
   ```bash
   ls -lh assets/sound/adhan_*.mp3
   # adhan_short.mp3 should be <400 KB
   # adhan_full.mp3 should be <1 MB
   ```

5. Test both files:
   - Short alert plays without errors
   - Full adhan plays without errors
   - Quality acceptable on both iOS and Android
   - Volume adjustable for both

6. Document audio sources and licenses in README

---

### ✅ Task 3: Create Notification Service (UPDATED)

**Changes from Original**:
- ✅ Added exact alarm permission functions (Android)
- ✅ Added battery optimization guidance
- ✅ Enhanced error handling for platform differences

**New Functions Required**:
```javascript
// NEW: Android exact alarm permission
requestExactAlarmPermission()
checkExactAlarmPermission()

// NEW: Battery optimization guidance
openBatteryOptimizationSettings()
```

**Implementation Steps** (Updated):

Create `utils/NotificationService.js`:

```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  // Request notification permissions
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Check current permission status
  async checkPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  // NEW: Request exact alarm permission (Android 12+)
  async requestExactAlarmPermission() {
    if (Platform.OS !== 'android' || Platform.Version < 31) {
      return true; // Not needed on iOS or Android <12
    }

    try {
      // Open Android settings for exact alarm permission
      const pkg = Constants.manifest?.android?.package || 'com.valabji.zikr';
      await IntentLauncher.startActivityAsync(
        'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
        {
          data: `package:${pkg}`
        }
      );
      return true;
    } catch (error) {
      console.error('Error requesting exact alarm permission:', error);
      return false;
    }
  },

  // NEW: Check exact alarm permission status (Android 12+)
  async checkExactAlarmPermission() {
    if (Platform.OS !== 'android' || Platform.Version < 31) {
      return true; // Not applicable
    }

    const { canScheduleExactAlarms } = await Notifications.getPermissionsAsync();
    return canScheduleExactAlarms || false;
  },

  // Schedule a prayer notification with SHORT alert sound
  async schedulePrayerNotification(prayerName, prayerTime, minutesBefore = 0) {
    try {
      // Calculate trigger time
      const triggerTime = new Date(prayerTime.getTime() - minutesBefore * 60 * 1000);
      
      // Generate unique ID
      const notificationId = `prayer_${prayerName}_${triggerTime.getTime()}`;
      
      // Schedule notification with SHORT sound
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: `${prayerName} Prayer Time`,
          body: minutesBefore > 0 
            ? `${prayerName} prayer in ${minutesBefore} minutes. Tap to hear Adhan.`
            : `Time for ${prayerName} prayer. Tap to hear Adhan.`,
          sound: 'adhan_short.mp3', // SHORT sound only
          data: {
            prayerName,
            playFullAdhan: true, // Flag to play full adhan on tap
            notificationId
          },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: triggerTime,
          channelId: 'prayer-times',
          exact: true, // Request exact timing on Android
        }
      });

      console.log(`Scheduled ${prayerName} notification for ${triggerTime}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  // Cancel specific prayer notification
  async cancelPrayerNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Cancel all prayer notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  // Get all scheduled notifications
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // NEW: Open battery optimization settings (Android)
  async openBatteryOptimizationSettings() {
    if (Platform.OS !== 'android') return;

    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
      );
    } catch (error) {
      console.error('Error opening battery settings:', error);
    }
  }
};
```

**Test Cases** (Updated):
- ✅ Permission request works on iOS
- ✅ Permission request works on Android
- ✅ Exact alarm permission request works (Android 12+)
- ✅ Notifications scheduled with exact timing
- ✅ Short alert sound specified (not full adhan)
- ✅ Cancellation works correctly
- ✅ Platform-specific handling correct

---

### ✅ Task 4: Extend Audio System for Adhan (UPDATED)

**Changes from Original**:
- ✅ Now supports TWO audio modes (short alert + full adhan)
- ✅ Separate player instances to avoid conflicts
- ✅ Added volume persistence for adhan

**Implementation Steps** (Updated):

Create `utils/AdhanAudio.js`:

```javascript
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const shortAlertSource = require('../assets/sound/adhan_short.mp3');
const fullAdhanSource = require('../assets/sound/adhan_full.mp3');
const ADHAN_VOLUME_KEY = '@zikr/adhan_volume';

export function useAdhanAudio() {
  const [volume, setVolume] = useState(0.8);
  
  // Separate players for short and full adhan
  const shortPlayer = useAudioPlayer(shortAlertSource);
  const fullPlayer = useAudioPlayer(fullAdhanSource);

  useEffect(() => {
    loadVolume();
  }, []);

  useEffect(() => {
    shortPlayer.volume = volume;
    fullPlayer.volume = volume;
  }, [volume]);

  const loadVolume = async () => {
    try {
      const savedVolume = await AsyncStorage.getItem(ADHAN_VOLUME_KEY);
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
    } catch (e) {
      console.warn('Failed to load adhan volume:', e);
    }
  };

  const setAdhanVolume = async (newVolume) => {
    try {
      await AsyncStorage.setItem(ADHAN_VOLUME_KEY, newVolume.toString());
      setVolume(newVolume);
    } catch (e) {
      console.warn('Failed to save adhan volume:', e);
    }
  };

  return {
    // Play short alert (for notifications)
    playShortAlert: async (customVolume = false) => {
      try {
        const actualVolume = customVolume !== false ? customVolume : volume;
        if (actualVolume > 0) {
          shortPlayer.volume = actualVolume;
          shortPlayer.seekTo(0);
          await shortPlayer.play();
        }
      } catch (error) {
        console.error('Error playing short alert:', error);
      }
    },

    // Play full adhan (when user taps notification)
    playFullAdhan: async (customVolume = false) => {
      try {
        const actualVolume = customVolume !== false ? customVolume : volume;
        if (actualVolume > 0) {
          fullPlayer.volume = actualVolume;
          fullPlayer.seekTo(0);
          await fullPlayer.play();
        }
      } catch (error) {
        console.error('Error playing full adhan:', error);
      }
    },

    // Stop any playing adhan
    stopAdhan: () => {
      try {
        if (shortPlayer.playing) shortPlayer.pause();
        if (fullPlayer.playing) fullPlayer.pause();
      } catch (error) {
        console.error('Error stopping adhan:', error);
      }
    },

    volume,
    setAdhanVolume,
    isPlaying: shortPlayer.playing || fullPlayer.playing
  };
}
```

---

### ✅ Task 6: Implement Notification Scheduling Logic (UPDATED)

**Changes from Original**:
- ✅ Always cancel all before rescheduling
- ✅ Add "last scheduled date" tracking
- ✅ Use short alert sound (not full adhan)
- ✅ Include playFullAdhan flag in payload

**Implementation Steps** (Updated):

Add to `constants/PrayerConstants.js`:
```javascript
STORAGE_KEYS: {
  // ... existing keys
  LAST_SCHEDULE_DATE: '@prayer_last_schedule_date'
}
```

Create scheduling function in `utils/PrayerUtils.js`:

```javascript
import { NotificationService } from './NotificationService';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

export const scheduleAllPrayerNotifications = async (
  location,
  calculationMethod,
  madhab,
  notificationSettings
) => {
  try {
    // Check permissions first
    const hasPermission = await NotificationService.checkPermissions();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return false;
    }

    // ALWAYS cancel all existing notifications first
    await NotificationService.cancelAllNotifications();

    // Get today's and tomorrow's prayer times
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimes = calculatePrayerTimes(location, calculationMethod, madhab, today);
    const tomorrowTimes = calculatePrayerTimes(location, calculationMethod, madhab, tomorrow);

    const now = new Date();
    let scheduledCount = 0;

    // Schedule today's remaining prayers
    for (const [prayer, time] of Object.entries(todayTimes)) {
      if (time > now && notificationSettings.notificationTimes[prayer]) {
        await NotificationService.schedulePrayerNotification(
          prayer,
          time,
          notificationSettings.minutesBefore || 0
        );
        scheduledCount++;
      }
    }

    // Schedule all of tomorrow's prayers
    for (const [prayer, time] of Object.entries(tomorrowTimes)) {
      if (notificationSettings.notificationTimes[prayer]) {
        await NotificationService.schedulePrayerNotification(
          prayer,
          time,
          notificationSettings.minutesBefore || 0
        );
        scheduledCount++;
      }
    }

    // Save last schedule date
    await AsyncStorage.setItem(
      PRAYER_CONSTANTS.STORAGE_KEYS.LAST_SCHEDULE_DATE,
      today.toISOString()
    );

    console.log(`Scheduled ${scheduledCount} prayer notifications`);
    return true;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return false;
  }
};

// Check if rescheduling needed (day changed)
export const needsRescheduling = async () => {
  try {
    const lastScheduleDate = await AsyncStorage.getItem(
      PRAYER_CONSTANTS.STORAGE_KEYS.LAST_SCHEDULE_DATE
    );
    
    if (!lastScheduleDate) return true;

    const lastDate = new Date(lastScheduleDate);
    const today = new Date();
    
    // Check if day changed
    return lastDate.getDate() !== today.getDate() ||
           lastDate.getMonth() !== today.getMonth() ||
           lastDate.getFullYear() !== today.getFullYear();
  } catch (error) {
    console.error('Error checking reschedule need:', error);
    return true; // Reschedule on error to be safe
  }
};

function calculatePrayerTimes(location, calculationMethod, madhab, date) {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod[calculationMethod]();
  params.madhab = madhab;
  
  const prayerTimes = new PrayerTimes(coords, date, params);
  
  return {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha
  };
}
```

---

### ✅ Task 7: App Initialization Integration (UPDATED - CRITICAL)

**Changes from Original**:
- ✅ Added notification channel setup (Android)
- ✅ Added notification response handler for FULL adhan playback
- ✅ Added day change detection and rescheduling
- ✅ Added location change monitoring

**Implementation Steps** (Updated):

Update `App.js`:

```javascript
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { NotificationService } from './utils/NotificationService';
import { useAdhanAudio } from './utils/AdhanAudio';
import { needsRescheduling, scheduleAllPrayerNotifications } from './utils/PrayerUtils';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const { playFullAdhan } = useAdhanAudio();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setupNotifications();
    setupAppStateListener();
    
    return () => {
      // Cleanup listeners
    };
  }, []);

  const setupNotifications = async () => {
    // Setup Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Prayer Times',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'adhan_short.mp3', // SHORT sound
        vibrationPattern: [0, 250, 250, 250],
        enableLights: true,
        lightColor: '#00FF00',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Listen for notification responses (user taps notification)
    Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    
    // Listen for foreground notifications
    Notifications.addNotificationReceivedListener(handleNotificationReceived);
  };

  // Handle notification tap - Play FULL adhan
  const handleNotificationResponse = async (response) => {
    try {
      const { playFullAdhan: shouldPlayAdhan, prayerName } = 
        response.notification.request.content.data;

      console.log(`Notification tapped for ${prayerName}`);

      // Play FULL adhan when user taps notification
      if (shouldPlayAdhan) {
        await playFullAdhan();
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  // Handle foreground notification
  const handleNotificationReceived = (notification) => {
    console.log('Notification received in foreground:', notification);
    // Short alert sound plays automatically
    // Do NOT play full adhan here
  };

  // Setup app state listener for rescheduling
  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        await checkAndReschedule();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  };

  // Check if rescheduling needed (day changed)
  const checkAndReschedule = async () => {
    try {
      if (await needsRescheduling()) {
        console.log('Day changed, rescheduling notifications');
        // Load current settings and reschedule
        // This will be implemented based on your settings storage
      }
    } catch (error) {
      console.error('Error checking for reschedule:', error);
    }
  };

  // ... rest of app code
}
```

---

### ✅ Task 8: Add Notification Management UI (UPDATED)

**Changes from Original**:
- ✅ Added exact alarm permission status (Android)
- ✅ Added battery optimization guidance
- ✅ Added "last rescheduled" status display

**New UI Elements**:

Add to `screens/UnifiedPrayerSettingsScreen.js`:

```javascript
// Permission Status Section
<View style={styles.managementSection}>
  <Text style={styles.sectionTitle}>{t('notifications.managementSection')}</Text>
  
  {/* Permission Status */}
  <View style={styles.permissionStatus}>
    <Text>{t('notifications.permissionStatus')}</Text>
    {permissionGranted ? (
      <Text style={styles.permissionGranted}>✅ {t('notifications.permissionGranted')}</Text>
    ) : (
      <Text style={styles.permissionDenied}>❌ {t('notifications.permissionDenied')}</Text>
    )}
  </View>

  {/* Android: Exact Alarm Status */}
  {Platform.OS === 'android' && Platform.Version >= 31 && (
    <View style={styles.exactAlarmStatus}>
      <Text>{t('notifications.exactAlarmStatus')}</Text>
      {exactAlarmGranted ? (
        <Text style={styles.permissionGranted}>✅ {t('notifications.exactAlarmGranted')}</Text>
      ) : (
        <View>
          <Text style={styles.permissionDenied}>❌ {t('notifications.exactAlarmDenied')}</Text>
          <Button 
            title={t('notifications.requestExactAlarm')}
            onPress={requestExactAlarmPermission}
          />
        </View>
      )}
    </View>
  )}

  {/* Battery Optimization Guidance (Android) */}
  {Platform.OS === 'android' && (
    <View style={styles.batteryGuidance}>
      <Text style={styles.warningText}>
        ⚠️ {t('notifications.batteryOptimizationWarning')}
      </Text>
      <Button 
        title={t('notifications.openBatterySettings')}
        onPress={() => NotificationService.openBatteryOptimizationSettings()}
      />
    </View>
  )}

  {/* Test Buttons */}
  <Button title={t('notifications.testShortAlert')} onPress={testShortAlert} />
  <Button title={t('notifications.testFullAdhan')} onPress={testFullAdhan} />
  <Button title={t('notifications.sendTestNotification')} onPress={sendTestNotification} />
  
  {/* Last Rescheduled */}
  {lastScheduleDate && (
    <Text style={styles.lastScheduled}>
      {t('notifications.lastRescheduled')}: {formatDate(lastScheduleDate)}
    </Text>
  )}
  
  {/* Manual Reschedule */}
  <Button 
    title={t('notifications.manualReschedule')}
    onPress={handleManualReschedule}
  />
  
  {/* Cancel All */}
  <Button 
    title={t('notifications.cancelAll')}
    onPress={handleCancelAll}
    color="red"
  />
</View>
```

---

## Updated Success Criteria

### Functional Requirements ✅
- [ ] Notifications arrive within 30 seconds of prayer time (tested on real devices)
- [ ] **Short alert plays** when notification arrives
- [ ] **Full adhan plays** when user taps notification
- [ ] Works with app closed, background, and foreground
- [ ] Exact alarm permission granted on Android 12+
- [ ] RTL layout works correctly

### Performance Requirements ✅
- [ ] Notification scheduling completes in <500ms
- [ ] App startup time increases by <200ms
- [ ] **Short alert** starts within 1 second
- [ ] **Full adhan** starts within 1 second after tap
- [ ] No memory leaks during extended use
- [ ] Battery drain increase <5% over 24 hours
- [ ] Total audio assets <1.5 MB

### Quality Requirements ✅
- [ ] **Physical device testing** on Android 13+ and iOS 15+
- [ ] Test coverage >80% for new code
- [ ] No critical or high-severity bugs
- [ ] Documentation complete
- [ ] **App Store compliance** verified

---

## Critical Testing Requirements

### Mandatory Physical Device Tests

**Android Device (13+)**:
- [ ] Notification arrives at exact time
- [ ] Short alert plays on arrival
- [ ] Tap notification opens app
- [ ] Full adhan plays after tap
- [ ] Works with battery saver enabled
- [ ] Works with app closed (swiped away)
- [ ] Exact alarm permission requested

**iOS Device (15+)**:
- [ ] Notification arrives at exact time
- [ ] Short alert plays on arrival
- [ ] Tap notification opens app
- [ ] Full adhan plays after tap
- [ ] Works with Low Power Mode
- [ ] Works with app closed
- [ ] No App Store policy violations

**Both Platforms**:
- [ ] Works in Do Not Disturb mode
- [ ] Rescheduling works after day change
- [ ] Location change triggers reschedule
- [ ] Volume controls work correctly
- [ ] RTL layout correct in Arabic

---

## App Store Submission Notes

### iOS App Store

**App Review Information**:
```
Prayer Notification Feature:
- Provides optional prayer time notifications
- Plays short alert sound (15-30s) when notification arrives
- User must TAP notification to hear full Adhan (60-120s)
- Fully user-controlled via settings
- Audio playback is user-initiated, not automatic
- Religious content clearly disclosed to users
```

**Privacy Manifest**:
```
NSUserNotificationsUsageDescription:
"This app uses notifications to remind you of Islamic prayer times. 
You can optionally enable Adhan audio playback by tapping notifications."
```

### Google Play Store

**Permissions Explanation**:
```
- POST_NOTIFICATIONS: To send prayer time reminders
- SCHEDULE_EXACT_ALARM: To ensure notifications arrive at precise prayer times
- USE_EXACT_ALARM: Required for Android 14+ to schedule exact alarms
```

**Feature Description**:
```
Receive accurate prayer time notifications with optional Adhan audio. 
Notifications use a short alert sound. Tap any notification to hear 
the complete Adhan call to prayer.
```

---

## Implementation Timeline

| Phase | Tasks | Days | Status |
|-------|-------|------|--------|
| Pre-Implementation | Decisions, Audio, Backup | 1-2 | ⏳ Pending |
| Phase 1 | Tasks 1-3 (Foundation) | 3-4 | ⏳ Pending |
| Phase 2 | Tasks 4-6 (Features) | 4-5 | ⏳ Pending |
| Phase 3 | Tasks 7-9 (Integration) | 3-4 | ⏳ Pending |
| Phase 4 | Task 10 (QA) | 5-7 | ⏳ Pending |
| **Total** | **All Tasks** | **16-22 days** | ⏳ Pending |

---

## Documentation References

For detailed information, see:

1. **DEVELOPER_CONCERNS_ANALYSIS.md** - Complete concern analysis with code examples
2. **CONCERNS_QUICK_REFERENCE.md** - Quick answers to common questions
3. **IMPLEMENTATION_CHECKLIST.md** - Step-by-step tracking checklist
4. **ANALYSIS_SUMMARY.md** - Executive summary of changes

---

## Final Notes

This updated plan incorporates all critical feedback from the React Native developer review:

✅ Conservative audio approach (short notification sound + tap-to-play full adhan)
✅ Proper Android exact alarm permissions
✅ Comprehensive iOS notification configuration
✅ Physical device testing requirements
✅ App Store compliance strategy
✅ Robust rescheduling logic
✅ Battery optimization guidance

**Status**: Ready for implementation with confidence

**Next Step**: Review all 4 analysis documents and make final decisions before starting Task 1
