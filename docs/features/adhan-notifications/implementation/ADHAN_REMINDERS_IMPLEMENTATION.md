# Adhan Reminders Implementation Plan

⚠️ **CRITICAL**: Before implementing, review the complete developer concerns analysis:
- 📋 **Start Here**: [Feature Overview](../README.md) - Quick navigation and links
- 🚀 **Quick Start**: [Quick Start Guide](../guides/QUICK_START_IMPLEMENTATION.md) - 5-minute setup
- 📋 **Analysis Summary**: [Analysis Summary](../analysis/ANALYSIS_SUMMARY.md) - Executive summary
- 🚀 **Quick Reference**: [Quick Reference](../analysis/CONCERNS_QUICK_REFERENCE.md) - Code snippets
- ✅ **Track Progress**: [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md) - Detailed checklist
- 📖 **Deep Dive**: [Developer Concerns](../analysis/DEVELOPER_CONCERNS_ANALYSIS.md) - Complete analysis
- 📝 **Updated Plan**: [Updated Plan](./UPDATED_IMPLEMENTATION_PLAN.md) - Enhanced task details
- 📊 **Visuals**: [Visual Summary](../analysis/VISUAL_SUMMARY.md) - Diagrams and flowcharts

## ⚠️ CRITICAL IMPLEMENTATION CHANGES

### 🔴 Audio Strategy (NON-NEGOTIABLE)
**DO NOT auto-play full adhan in background**. Platform limitations and App Store policies require:
- ✅ Play **short alert sound** (15-30s) when notification arrives
- ✅ Play **full adhan** (60-120s) ONLY when user taps notification
- ❌ NO automatic background playback of full adhan

**Why**: iOS/Android restrict long background audio, App Store may reject, battery concerns.

### 🔴 Android Exact Alarms (CRITICAL)
Must add exact alarm permissions or notifications will be delayed 15-30 minutes:
```javascript
"android.permission.SCHEDULE_EXACT_ALARM"
"android.permission.USE_EXACT_ALARM" // Android 14+
```

### 🔴 Physical Device Testing (MANDATORY)
Emulators cannot test real notification behavior. Must test on:
- Real Android 13+ device
- Real iOS 15+ device

## Overview
This document outlines the implementation of adhan (call to prayer) reminders for the Zikr prayer app. The feature will allow users to receive notifications at prayer times with optional adhan audio playback.

**⚠️ IMPORTANT**: This plan has been enhanced based on comprehensive React Native developer review. See analysis documents above for complete details.

## Current State Analysis

### ✅ Existing Infrastructure
- **Settings UI**: Notification toggles exist in `UnifiedPrayerSettingsScreen.js` with per-prayer enable/disable functionality
- **Prayer Calculations**: Robust prayer time calculation system using the `adhan` library (v4.4.3)
- **Audio System**: Modern audio playback using `expo-audio` with volume control in `utils/Sounds.js`
- **Storage**: AsyncStorage integration with dedicated storage keys in `PrayerConstants.js`
- **Localization**: Full i18n support with Arabic and English locales in `locales/` directory
- **Permissions**: Location permissions already configured for Android and iOS in `app.config.js`

### ❌ Missing Components
- **Notification Library**: `expo-notifications` not installed
- **Notification Permissions**: Not configured in `app.config.js`
- **Adhan Audio Files**: No audio files for call to prayer in `assets/sound/`
- **Notification Service**: No service layer for scheduling/managing notifications
- **Notification Scheduling Logic**: No implementation to schedule notifications based on prayer times
- **Background Notification Handling**: No app-level notification listener setup

## TDD Tasks

### Task 1: Setup Dependencies and Configuration
**Description**: Install required dependencies and configure app permissions for notifications.

**⚠️ CRITICAL CHANGES**:
- ✅ Added Android exact alarm permissions (SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM)
- ✅ Added iOS notification permission strings (NSUserNotificationsUsageDescription)
- ✅ Added iOS background modes for audio
- ✅ Added prebuild safety procedures (backup before prebuild)

**Acceptance Criteria**:
- `expo-notifications` library is installed (v0.28.19 for SDK 54)
- iOS notification permissions configured with NSUserNotificationsUsageDescription
- iOS UIBackgroundModes includes audio and remote-notification
- Android POST_NOTIFICATIONS permission added (Android 13+)
- Android SCHEDULE_EXACT_ALARM permission added (critical for timing)
- Android USE_EXACT_ALARM permission added (Android 14+)
- Native directories backed up before prebuild
- Google Services files verified after prebuild
- App builds successfully on iOS and Android without errors

**Test Cases**:
- Verify `package.json` contains `expo-notifications@~0.28.19`
- Verify `app.config.js` includes all required iOS permissions
- Verify `app.config.js` includes all required Android permissions
- Verify Google Services files exist after prebuild
- Build process completes without errors on both platforms
- Notification permission requests work on physical devices
- Exact alarm permission request works on Android 12+ devices

**Implementation Steps**:

**⚠️ STEP 0 - BACKUP FIRST (CRITICAL)**:
```bash
# Create feature branch
git checkout -b feature/adhan-notifications
git add .
git commit -m "Pre-notification-feature backup"

# Backup native directories
cp -r android android_backup
cp -r ios ios_backup
cp google-services.json google-services.json.backup
cp GoogleService-Info.plist GoogleService-Info.plist.backup
```

1. Install expo-notifications (SDK 54 compatible):
```bash
yarn add expo-notifications@~0.28.19
```

2. Update `app.config.js` - iOS section:
```javascript
ios: {
  bundleIdentifier: "com.valabji.zikr",
  googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
  supportsTablet: true,
  buildNumber: "15",
  infoPlist: {
    CFBundleAllowMixedLocalizations: true,
    // NEW: Notification permission description
    NSUserNotificationsUsageDescription: 
      "This app uses notifications to remind you of prayer times with the option to play Adhan audio.",
    // NEW: Background modes for audio and notifications
    UIBackgroundModes: ["audio", "remote-notification"]
  }
}
```

3. Update `app.config.js` - Android section:
```javascript
android: {
  permissions: [
    // ... existing permissions
    "android.permission.VIBRATE",
    
    // NEW: Notification permissions
    "android.permission.POST_NOTIFICATIONS",        // Android 13+ requirement
    "android.permission.SCHEDULE_EXACT_ALARM",      // For precise prayer time notifications
    "android.permission.USE_EXACT_ALARM"            // Android 14+ requirement
  ]
}
```

4. Run prebuild and verify:
```bash
expo prebuild --clean

# VERIFY Google Services files copied correctly
ls -la android/app/google-services.json
ls -la ios/GoogleService-Info.plist

# If files missing, restore from backup:
# cp google-services.json.backup android/app/google-services.json
# cp GoogleService-Info.plist.backup ios/GoogleService-Info.plist
```

5. Test builds:
```bash
yarn android  # Test Android build
yarn ios      # Test iOS build

# If build fails, restore from backup:
# cp -r android_backup android
# cp -r ios_backup ios
```

6. Test permission requests on **PHYSICAL DEVICES** (not emulators):
   - Test notification permission dialog on iOS
   - Test notification permission dialog on Android
   - Test exact alarm permission on Android 12+
   - Verify permission granted/denied scenarios

---

### Task 2: Add Adhan Audio Assets
**Description**: Add adhan (call to prayer) audio files to the assets/sound directory.

**⚠️ CRITICAL CHANGES**:
- ✅ Now requires **TWO audio files** (short alert + full adhan)
- ✅ Short alert (15-30s, <400 KB) for notification sound
- ✅ Full adhan (60-120s, <1 MB) for in-app playback when user taps
- ✅ Total audio size <1.5 MB to minimize app bundle impact

**Why Two Files**: 
- iOS/Android restrict long audio in background notifications
- Short alert plays reliably when notification arrives
- Full adhan plays only when user taps notification (app opens)
- Better battery life and App Store compliance

**Acceptance Criteria**:
- **Short alert audio** (15-30 seconds, <400 KB, MP3 format) available
- **Full adhan audio** (60-120 seconds, <1 MB, MP3 format) available
- Both files are 128kbps bitrate MP3 format
- Both files play correctly using `expo-audio`
- Total audio size is <1.5 MB
- Audio quality is clear and appropriate for prayer calls
- Files documented with source/license information

**File Structure**:
```
assets/sound/
  ├── adhan_short.mp3   (~300 KB) - For notification alerts
  ├── adhan_full.mp3    (~800 KB) - For in-app playback after tap
  └── kikhires.mp3      (existing click sound)
```

**Test Cases**:
- Short alert file exists and is <400 KB
- Full adhan file exists and is <1 MB
- Total audio files <1.5 MB
- Short alert plays correctly (15-30s duration)
- Full adhan plays correctly (60-120s duration)
- Both files load without errors on both platforms
- Audio volume is adjustable for both files
- No audio cutoff or quality issues
- Files documented in README with source/license

**Implementation Steps**:

1. Obtain royalty-free or properly licensed adhan audio in high quality

2. Create **short alert** version (15-30 seconds):
```bash
# Extract first 30 seconds and compress to 128kbps
ffmpeg -i original_adhan.wav -t 30 -codec:a libmp3lame -b:a 128k -ar 44100 adhan_short.mp3

# Verify file size
ls -lh adhan_short.mp3
# Should be ~200-400 KB
```

3. Create **full adhan** version (60-120 seconds):
```bash
# Compress full adhan to 128kbps
ffmpeg -i original_adhan.wav -codec:a libmp3lame -b:a 128k -ar 44100 adhan_full.mp3

# Verify file size
ls -lh adhan_full.mp3
# Should be ~600 KB - 1 MB
```

4. Add files to project:
```
cp adhan_short.mp3 assets/sound/
cp adhan_full.mp3 assets/sound/
```

5. Verify total size:
```bash
du -sh assets/sound/
# Total should be <2 MB including existing sounds
```

6. Test playback using the existing `expo-audio` infrastructure:
   - Test short alert on iOS device
   - Test short alert on Android device
   - Test full adhan on iOS device
   - Test full adhan on Android device
   - Verify audio quality acceptable on both
   - Test volume control for both files

7. Document in README:
   - Audio source and license
   - File purposes (short vs. full)
   - Compression settings used
   - Total app size impact

---

### Task 3: Create Notification Service
**Description**: Implement a comprehensive notification service to handle scheduling, triggering, and managing prayer time notifications.

**Acceptance Criteria**:
- `utils/NotificationService.js` utility module is created and exported
- Service can request and check notification permissions (iOS and Android)
- Service can schedule notifications for specific prayer times with configurable advance timing
- Service can cancel individual prayer notifications or all notifications
- Service properly handles notification identifiers for tracking
- Service integrates with `expo-notifications` API properly
- Error handling for all edge cases (permissions denied, scheduling failures, etc.)

**Test Cases**:
- Permission request flow works on both platforms
- Permission status can be checked without prompting user
- Notifications are scheduled with correct triggers (time-based)
- Each prayer notification has a unique identifier
- Canceling specific prayer notifications works correctly
- Cancel all notifications clears all scheduled prayer notifications
- Service gracefully handles permission denied scenarios
- Service handles platform-specific differences (iOS vs Android)

**⚠️ CRITICAL ADDITIONS**:
- ✅ Added `requestExactAlarmPermission()` for Android 12+
- ✅ Added `checkExactAlarmPermission()` for Android 12+
- ✅ Added `openBatteryOptimizationSettings()` for user guidance
- ✅ Notification uses **SHORT sound** (adhan_short.mp3), NOT full adhan
- ✅ Added `exact: true` flag for Android scheduling
- ✅ Include `playFullAdhan: true` in data payload (plays when user taps)

**Implementation Steps**:
1. Create `utils/NotificationService.js` with proper imports:
```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
```

2. Implement `requestPermissions()` async function:
   - Request permissions using `Notifications.requestPermissionsAsync()`
   - Handle iOS-specific permissions (alert, sound, badge)
   - Return permission status object

3. Implement `checkPermissions()` function to check current permission status

4. **NEW**: Implement `requestExactAlarmPermission()` for Android 12+:
```javascript
async requestExactAlarmPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 31) {
    return true; // Not needed on iOS or Android <12
  }
  
  try {
    const pkg = Constants.manifest?.android?.package || 'com.valabji.zikr';
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
      { data: `package:${pkg}` }
    );
    return true;
  } catch (error) {
    console.error('Error requesting exact alarm permission:', error);
    return false;
  }
}
```

5. **NEW**: Implement `checkExactAlarmPermission()` for Android 12+

6. Implement `schedulePrayerNotification(prayerName, prayerTime, minutesBefore)`:
   - Generate unique identifier for each prayer notification
   - Calculate trigger time based on prayer time and minutesBefore offset
   - **⚠️ CRITICAL**: Set notification content with SHORT sound:
     ```javascript
     sound: 'adhan_short.mp3',  // SHORT sound only (15-30s)
     data: {
       prayerName,
       playFullAdhan: true,  // Flag to play full adhan when user TAPS
       notificationId
     }
     ```
   - Use `Notifications.scheduleNotificationAsync()` with **exact timing**:
     ```javascript
     trigger: {
       type: 'date',
       date: triggerTime,
       channelId: 'prayer-times',
       exact: true  // Force exact timing on Android
     }
     ```
   - Store notification identifier for later cancellation

7. Implement `cancelPrayerNotification(notificationId)`:
   - Use `Notifications.cancelScheduledNotificationAsync()`

8. Implement `cancelAllNotifications()`:
   - Use `Notifications.cancelAllScheduledNotificationsAsync()`

9. **NEW**: Implement `openBatteryOptimizationSettings()` (Android):
```javascript
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
```

10. Add comprehensive error handling with try-catch blocks
11. Add logging for debugging purposes
12. Export all functions as a service object

---

### Task 4: Extend Audio System for Adhan
**Description**: Extend or create a dedicated audio utility to support adhan audio playback with volume control.

**⚠️ CRITICAL CHANGES**:
- ✅ Now supports **TWO audio modes** (short alert + full adhan)
- ✅ Separate player instances to avoid conflicts
- ✅ Short alert for notifications, full adhan for in-app playback
- ✅ Both use same volume settings

**Acceptance Criteria**:
- **Short alert** (15-30s) can be played for notifications
- **Full adhan** (60-120s) can be played when user taps notification
- Separate player instances for short and full audio (no conflicts)
- Volume control works correctly (0.0 to 1.0 range) for both
- User's adhan volume settings are persisted in AsyncStorage
- Audio playback uses `expo-audio` (already in use via `useAudioPlayer` hook)
- Audio doesn't conflict with existing click sound system in `utils/Sounds.js`
- Audio stops properly and doesn't leak memory

**Test Cases**:
- Short alert plays correctly at set volume
- Full adhan plays correctly at set volume
- Volume changes apply to both audio files
- Volume changes are persisted and loaded correctly
- Multiple playback requests don't cause conflicts
- Audio stops properly when needed
- No audio conflicts with existing click sounds
- Memory is properly managed (no audio player leaks)
- Both players can be used independently

**Implementation Steps**:

1. Create `utils/AdhanAudio.js`:
```javascript
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const shortAlertSource = require('../assets/sound/adhan_short.mp3');
const fullAdhanSource = require('../assets/sound/adhan_full.mp3');
const ADHAN_VOLUME_KEY = '@zikr/adhan_volume';

export function useAdhanAudio() {
  const [volume, setVolume] = useState(0.8);
  
  // ⚠️ CRITICAL: Separate players for short and full adhan
  const shortPlayer = useAudioPlayer(shortAlertSource);
  const fullPlayer = useAudioPlayer(fullAdhanSource);
  
  // ... volume management code
}
```

2. Implement audio player with volume control:
   - Create `useAdhanAudio()` hook similar to existing `useAudio()` hook
   - Add `playShortAlert()` function for notification sound (15-30s)
   - Add `playFullAdhan()` function for tap-to-play (60-120s)
   - Add `stopAdhan()` function to stop any playback
   - Handle audio player state properly for both players
   - Apply volume to both players

3. Add storage key for adhan volume in `constants/PrayerConstants.js`:
   - Add `ADHAN_VOLUME: '@prayer_adhan_volume'` to `STORAGE_KEYS`

4. Implement volume persistence:
   - `loadAdhanVolume()` function to retrieve from AsyncStorage
   - `setAdhanVolume()` function to save to AsyncStorage
   - Default volume: 0.8 (80%)
   - Volume applies to both short alert and full adhan

5. Export adhan audio functions:
   - `playShortAlert()` - Used by notification system
   - `playFullAdhan()` - Used when user taps notification
   - `stopAdhan()` - Stop any playing audio
   - `volume` and `setAdhanVolume()` - For settings UI

6. Test on both platforms:
   - Test short alert plays correctly (15-30s)
   - Test full adhan plays correctly (60-120s)
   - Test volume control affects both
   - Test no conflicts between players
   - Test no memory leaks

---

### Task 5: Enhance Settings Screen
**Description**: Add comprehensive settings UI for adhan reminders including timing, volume, and audio preferences.

**⚠️ CRITICAL ADDITIONS**:
- ✅ Add exact alarm permission UI (Android 12+)
- ✅ Add battery optimization guidance section
- ✅ Request permissions in correct order
- ✅ Show permission status indicators
- ✅ Separate test buttons for short alert vs full adhan

**Acceptance Criteria**:
- Users can set minutes before prayer time for advance notifications (0, 5, 10, 15, 30 minutes)
- Users can enable/disable adhan audio playback for notifications
- Users can adjust adhan volume separately from click sounds (0-100%)
- **Users see exact alarm permission status (Android 12+)**
- **Users can request exact alarm permission from UI**
- **Users see battery optimization guidance (Android)**
- All settings are persisted to AsyncStorage and loaded on app start
- Settings UI follows existing app design patterns and RTL support
- Settings changes trigger notification rescheduling
- Form validation ensures valid input values

**Test Cases**:
- Reminder timing picker saves and loads correctly
- Adhan audio toggle state persists across app restarts
- Volume slider updates immediately and persists
- Settings are independent of click sound volume
- **Exact alarm permission request opens system settings (Android 12+)**
- **Battery optimization button opens device settings**
- Invalid or out-of-range values are rejected gracefully
- RTL layout works correctly in Arabic mode
- Settings changes trigger immediate notification updates
- **Test short alert button plays 15-30s audio**
- **Test full adhan button plays 60-120s audio**

**Implementation Steps**:
1. Update `constants/PrayerConstants.js` to add new storage keys:
   - `REMINDER_MINUTES_BEFORE: '@prayer_reminder_minutes_before'`
   - `ADHAN_ENABLED: '@prayer_adhan_enabled'`
   - `ADHAN_VOLUME: '@prayer_adhan_volume'`

2. Update `screens/UnifiedPrayerSettingsScreen.js` - Add state management:
   - Add state variables for new settings (reminderMinutesBefore, adhanEnabled, adhanVolume)
   - **Add state for `exactAlarmGranted` (Android 12+)**
   - Add settings load functions in `loadSettings()` method
   - Add settings save functions when changes occur

3. **Add exact alarm permission section (Android 12+)**:
   - Display permission status with icon (✅ or ❌)
   - Show descriptive explanation of why it's needed
   - Add "Enable Precise Timing" button if not granted
   - Button calls `NotificationService.requestExactAlarmPermission()`
   - Update UI after permission granted

4. **Add battery optimization guidance section (Android)**:
   - Show warning text about potential delays
   - Explain device-specific battery optimization
   - Add "Open Battery Settings" button
   - Button calls `NotificationService.openBatteryOptimizationSettings()`
   - Provide clear instructions

5. Add UI components in settings screen:
   - Add "Notification Settings" section with header
   - Add timing picker using Modal/Picker component (options: At Prayer Time, 5, 10, 15, 30 minutes before)
   - Add adhan audio enable/disable toggle using `CustomToggle` component
   - Add adhan volume slider using `@react-native-community/slider` with preview playback
   - **Add "Test Short Alert" button (plays adhan_short.mp3, 15-30s)**
   - **Add "Test Full Adhan" button (plays adhan_full.mp3, 60-120s)**

6. Implement change detection:
   - Track initial values for new settings
   - Update `hasChanges` detection logic to include new settings
   - Include new settings in save/discard logic

7. Add localization strings for new UI elements (see Task 9)

8. Ensure proper layout and spacing following existing design patterns

9. Test all settings interactions and persistence on **PHYSICAL DEVICES**

---

### Task 6: Implement Notification Scheduling Logic
**Description**: Implement comprehensive logic to schedule, update, and manage prayer time notifications based on user settings and location.

**⚠️ CRITICAL CHANGES**:
- ✅ **ALWAYS cancel all notifications before rescheduling** (prevents duplicates)
- ✅ Add "last schedule date" tracking to detect day changes
- ✅ Notifications use **SHORT sound** (adhan_short.mp3) not full adhan
- ✅ Include `playFullAdhan: true` flag in payload (for tap-to-play)
- ✅ Schedule 24-48 hours ahead (today + tomorrow)
- ✅ Reschedule on app foreground if day changed

**Acceptance Criteria**:
- **ALWAYS** cancel all existing notifications before scheduling new ones
- Track last schedule date in AsyncStorage
- Detect day changes and trigger rescheduling
- Notifications are automatically scheduled when location or prayer times change
- Notifications respect per-prayer enable/disable settings from `notificationTimes` state
- Notifications respect advance notification timing (minutesBefore setting)
- Notifications include localized title and body text
- Notification uses **short alert sound** (adhan_short.mp3)
- Notification payload includes `playFullAdhan: true` flag
- Notifications are rescheduled daily to account for changing prayer times
- Schedule today's remaining prayers + all tomorrow's prayers

**Test Cases**:
- Notifications are scheduled after location change
- Only prayers with enabled notifications get scheduled
- Notification timing correctly reflects minutesBefore offset
- Notifications update when user changes settings
- Daily rescheduling works correctly (at midnight or after Isha)
- Notifications are localized in user's language
- Adhan payload is included when adhan is enabled
- Edge cases handled (no location, permission denied, etc.)

**Implementation Steps**:

1. Add storage key in `constants/PrayerConstants.js`:
```javascript
STORAGE_KEYS: {
  // ... existing keys
  LAST_SCHEDULE_DATE: '@prayer_last_schedule_date'
}
```

2. Create notification scheduling utility in `utils/PrayerUtils.js`:
```javascript
export const scheduleAllPrayerNotifications = async (
  location,
  calculationMethod,
  madhab,
  notificationSettings
) => {
  try {
    // ⚠️ CRITICAL: ALWAYS cancel all first (prevents duplicates)
    await NotificationService.cancelAllNotifications();
    
    // Calculate today's and tomorrow's prayer times
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
    return true; // Reschedule on error to be safe
  }
};
```

3. Integrate scheduling in `UnifiedPrayerSettingsScreen.js`:
   - Call scheduling function after location selection/change
   - Call scheduling function in settings save handler
   - **Always cancel all before rescheduling** (already done in scheduling function)

4. Implement notification received handler (Task 7):
   - Short alert plays automatically from notification
   - Full adhan plays only when user taps notification

5. Implement daily rescheduling logic (Task 7):
   - Monitor app state changes (foreground/background)
   - Check `needsRescheduling()` when app comes to foreground
   - Reschedule if day changed

6. Add proper error handling:
   - Handle missing location data
   - Handle permission denied scenarios  
   - Handle scheduling failures gracefully
   - Log all operations for debugging

---

### Task 7: App Initialization Integration
**Description**: Integrate notification service initialization and handlers into app startup flow.

**⚠️ CRITICAL CHANGES**:
- ✅ Added Android notification channel setup with SHORT sound
- ✅ Added notification response handler to play FULL adhan on tap
- ✅ Added day change detection and rescheduling
- ✅ Added location change monitoring
- ✅ Short alert plays in notification, full adhan only on user tap

**Acceptance Criteria**:
- Android notification channel created with correct sound (adhan_short.mp3)
- Notification system initializes on app startup without blocking UI
- Notification permissions are requested appropriately (not on first launch, but when user enables notifications)
- **Short alert** plays when notification arrives
- **Full adhan** plays ONLY when user taps notification
- Notification response handler extracts `playFullAdhan` flag from payload
- Day change detection triggers automatic rescheduling
- Location change triggers rescheduling
- Existing prayer notifications are validated and rescheduled on app start if needed
- App handles permission denied scenarios gracefully
- Background notification handling works correctly
- App doesn't crash or hang due to notification initialization

**Test Cases**:
- App starts successfully with notification system initialized
- Permission request flow works when triggered from settings
- Existing scheduled notifications persist across app restarts
- App functions normally when permissions are denied
- Tapping notification opens app correctly
- Background notifications trigger even when app is closed
- Adhan plays correctly when notification is received (foreground and background)

**Implementation Steps**:

1. Update `App.js` to set up notification infrastructure:
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
    shouldPlaySound: true,  // Plays SHORT alert from notification
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
  
  // ... rest of component
}
```

2. Set up Android notification channel:
```javascript
const setupNotifications = async () => {
  // Setup Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'adhan_short.mp3',  // ⚠️ SHORT sound only
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
```

3. Implement notification received handler (foreground):
```javascript
const handleNotificationReceived = (notification) => {
  console.log('Notification received in foreground:', notification);
  // Short alert sound plays automatically
  // Do NOT play full adhan here
};
```

4. **⚠️ CRITICAL**: Implement notification response handler (user tap):
```javascript
const handleNotificationResponse = async (response) => {
  try {
    const { playFullAdhan: shouldPlayAdhan, prayerName } = 
      response.notification.request.content.data;
    
    console.log(`Notification tapped for ${prayerName}`);
    
    // ⚠️ Play FULL adhan when user taps notification
    if (shouldPlayAdhan) {
      await playFullAdhan();
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
  }
};
```

5. Set up app state listener for rescheduling:
```javascript
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
```

6. Initialize in useEffect:
   - Set up notification listeners
   - Don't auto-request permissions (wait for user action in settings)
   - Clean up listeners on unmount

7. Add comprehensive error handling and logging

8. Test on both iOS and Android:
   - Test notification in foreground (short alert plays)
   - Test notification in background (short alert plays)
   - Test notification with app closed (short alert plays)
   - Test tapping notification (full adhan plays)
   - Test rescheduling on day change
   - Test on physical devices (not emulators)

---

### Task 8: Add Notification Management UI
**Description**: Add debug and management UI elements to help users test and manage prayer notifications.

**Acceptance Criteria**:
- Users can view currently scheduled notifications with times and prayers
- Users can manually test adhan playback without scheduling notifications
- Users can test complete notification flow with preview
- Users can cancel all scheduled notifications with confirmation
- UI provides clear feedback on notification status and actions
- Permission status is clearly displayed to user
- All UI follows app design patterns and supports RTL

**Test Cases**:
- Scheduled notifications list displays correct prayer times and names
- Test adhan button plays audio at current volume setting
- Test notification button triggers a preview notification
- Cancel all notifications clears schedule and updates UI
- Permission denied state shows helpful message
- UI updates in real-time when notifications are scheduled/canceled
- RTL layout works correctly for Arabic users
- Loading and error states display properly

**⚠️ CRITICAL ADDITIONS**:
- ✅ Add exact alarm permission status display (Android 12+)
- ✅ Add battery optimization guidance UI
- ✅ Add "last rescheduled" status display
- ✅ Add manual reschedule button
- ✅ Test buttons for both short alert AND full adhan

**Implementation Steps**:

1. Add notification management section to `UnifiedPrayerSettingsScreen.js`:
```javascript
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
</View>
```

2. Add test buttons:
   - **"Test Short Alert"** - Plays short alert (15-30s) at current volume
   - **"Test Full Adhan"** - Plays full adhan (60-120s) at current volume
   - **"Send Test Notification"** - Schedules test notification for 5 seconds

3. Add "Scheduled Notifications" display section:
   - Query scheduled notifications using `Notifications.getAllScheduledNotificationsAsync()`
   - Display list of upcoming prayer notifications with:
     * Prayer name (localized)
     * Scheduled time (formatted)
     * Days until notification
   - Show "No notifications scheduled" if list is empty

4. Add "Last Rescheduled" status:
```javascript
{lastScheduleDate && (
  <Text style={styles.lastScheduled}>
    {t('notifications.lastRescheduled')}: {formatDate(lastScheduleDate)}
  </Text>
)}
```

5. Add "Manual Reschedule" button:
   - Useful if user suspects notifications not scheduled
   - Calls scheduleAllPrayerNotifications() directly
   - Shows success/error feedback

6. Add "Cancel All Notifications" button:
   - Show confirmation alert before canceling
   - Cancel all scheduled notifications
   - Update UI to reflect changes
   - Show success message

7. Add loading states for async operations:
   - Show spinner when querying notifications
   - Show spinner when canceling notifications
   - Disable buttons during operations

8. Add error handling and user feedback:
   - Show error alerts for failures
   - Display helpful messages for permission issues
   - Provide guidance on how to enable permissions in system settings

9. Ensure proper styling and spacing following existing app patterns

10. Test all interactions on **PHYSICAL DEVICES** (both platforms)

---

### Task 9: Localization and RTL Support
**Description**: Ensure all new UI elements, notifications, and messages support Arabic/English localization with proper RTL layout.

**Acceptance Criteria**:
- All new UI text strings are properly localized in both languages
- RTL layout works correctly for Arabic mode without breaking UI
- Notification titles and bodies are localized based on app language
- Prayer names in notifications are localized
- Date/time formatting respects locale and uses 12/24 hour format appropriately
- Number formatting (e.g., volume percentages) respects locale
- All buttons, labels, and descriptions have translations
- No hardcoded English strings in code

**Test Cases**:
- All UI elements display correct Arabic translations
- RTL layout properly mirrors UI elements (buttons, sliders, toggles)
- Notification messages appear in user's selected language
- Prayer times in notifications use locale-appropriate formatting
- Time formatting matches user expectations (12h for English, 24h option)
- Volume percentages and numbers display correctly in both languages
- Switching language updates all notification-related UI immediately
- Test notifications send messages in correct language

**⚠️ CRITICAL ADDITIONS**:
- ✅ Add exact alarm permission translations (Android)
- ✅ Add battery optimization guidance translations (Android)
- ✅ Add short alert vs full adhan labels
- ✅ Add last rescheduled date text

**Implementation Steps**:

1. Add notification-related keys to `locales/en.json`:
   ```json
   "notifications": {
     "title": "Prayer Notifications",
     "permissionDenied": "Notification Permission Denied",
     "permissionDeniedMessage": "Please enable notifications in your device settings to receive prayer reminders.",
     "permissionGranted": "Notifications Enabled",
     "permissionStatus": "Permission Status",
     "permissionRequired": "Permission Required",
     
     "exactAlarmTitle": "Precise Timing (Android)",
     "exactAlarmDescription": "Required for timely prayer notifications. Without this, notifications may be delayed by 15-30 minutes.",
     "exactAlarmStatus": "Exact Alarm Permission",
     "exactAlarmGranted": "Enabled - Notifications will arrive on time",
     "exactAlarmDenied": "Not Enabled - Notifications may be delayed",
     "requestExactAlarm": "Enable Precise Timing",
     
     "batteryOptimizationTitle": "Battery Optimization",
     "batteryOptimizationWarning": "Some Android devices may delay notifications to save battery. If notifications don't arrive on time, disable battery optimization for this app.",
     "batteryOptimizationInstructions": "Tap below to open battery settings and disable optimization for Zikr app.",
     "openBatterySettings": "Open Battery Settings",
     
     "minutesBefore": "Notify Before Prayer",
     "atPrayerTime": "At prayer time",
     "minutesBeforeFormat": "{minutes} minutes before",
     "adhanEnabled": "Play Adhan Sound",
     "adhanVolume": "Adhan Volume",
     "testShortAlert": "Test Short Alert (15-30s)",
     "testFullAdhan": "Test Full Adhan (60-120s)",
     "testNotification": "Send Test Notification",
     
     "managementSection": "Notification Management",
     "lastRescheduled": "Last updated",
     "manualReschedule": "Reschedule Now",
     "cancelAll": "Cancel All Notifications",
     "cancelAllConfirm": "Cancel All Notifications?",
     "cancelAllMessage": "This will cancel all scheduled prayer notifications. You can reschedule them by saving your settings again.",
     
     "scheduledNotifications": "Scheduled Notifications",
     "noNotifications": "No notifications scheduled",
     "notificationTitle": "{prayer} Prayer Time",
     "notificationBody": "It's time for {prayer} prayer",
     "notificationBodyBefore": "{prayer} prayer in {minutes} minutes",
     "testNotificationTitle": "Test Notification",
     "testNotificationBody": "This is a test notification from Zikr app"
   }
   ```

2. Add corresponding Arabic translations to `locales/ar.json`:
   ```json
   "notifications": {
     "title": "إشعارات الصلاة",
     "permissionDenied": "تم رفض إذن الإشعارات",
     "permissionDeniedMessage": "يرجى تفعيل الإشعارات في إعدادات جهازك لتلقي تذكيرات الصلاة.",
     "permissionGranted": "الإشعارات مفعلة",
     "permissionStatus": "حالة الإذن",
     "permissionRequired": "الإذن مطلوب",
     
     "exactAlarmTitle": "التوقيت الدقيق (أندرويد)",
     "exactAlarmDescription": "مطلوب للإشعارات في الوقت المحدد. بدون هذا الإذن، قد تتأخر الإشعارات 15-30 دقيقة.",
     "exactAlarmStatus": "إذن التنبيه الدقيق",
     "exactAlarmGranted": "مفعّل - ستصل الإشعارات في الوقت المحدد",
     "exactAlarmDenied": "غير مفعّل - قد تتأخر الإشعارات",
     "requestExactAlarm": "تفعيل التوقيت الدقيق",
     
     "batteryOptimizationTitle": "تحسين البطارية",
     "batteryOptimizationWarning": "بعض أجهزة الأندرويد قد تؤخر الإشعارات لتوفير البطارية. إذا لم تصل الإشعارات في الوقت المحدد، قم بتعطيل تحسين البطارية لهذا التطبيق.",
     "batteryOptimizationInstructions": "اضغط أدناه لفتح إعدادات البطارية وتعطيل التحسين لتطبيق ذكر.",
     "openBatterySettings": "فتح إعدادات البطارية",
     
     "minutesBefore": "التنبيه قبل الصلاة",
     "atPrayerTime": "عند وقت الصلاة",
     "minutesBeforeFormat": "قبل {minutes} دقيقة",
     "adhanEnabled": "تشغيل صوت الأذان",
     "adhanVolume": "مستوى صوت الأذان",
     "testShortAlert": "تجربة التنبيه القصير (15-30 ثانية)",
     "testFullAdhan": "تجربة الأذان الكامل (60-120 ثانية)",
     "testNotification": "إرسال إشعار تجريبي",
     
     "managementSection": "إدارة الإشعارات",
     "lastRescheduled": "آخر تحديث",
     "manualReschedule": "إعادة الجدولة الآن",
     "cancelAll": "إلغاء كل الإشعارات",
     "cancelAllConfirm": "إلغاء كل الإشعارات؟",
     "cancelAllMessage": "سيتم إلغاء جميع إشعارات الصلاة المجدولة. يمكنك إعادة جدولتها بحفظ الإعدادات مرة أخرى.",
     
     "scheduledNotifications": "الإشعارات المجدولة",
     "noNotifications": "لا توجد إشعارات مجدولة",
     "notificationTitle": "موعد صلاة {prayer}",
     "notificationBody": "حان وقت صلاة {prayer}",
     "notificationBodyBefore": "صلاة {prayer} بعد {minutes} دقيقة",
     "testNotificationTitle": "إشعار تجريبي",
     "testNotificationBody": "هذا إشعار تجريبي من تطبيق ذِكْر"
   }
   ```
3. Update notification scheduling code to use localized strings:
   - Use `t('notifications.notificationTitle', { prayer: t('prayerTimes.fajr') })`
   - Use `t('notifications.notificationBody', { prayer: prayerName })`
   - Apply localization in NotificationService when creating notifications
4. Update UI components to use t() function for all text:
   - Replace hardcoded strings with `t('notifications.keyName')`
   - Use template strings with variables for dynamic content
5. Test RTL layout thoroughly:
   - Switch app to Arabic mode
   - Verify all notification UI elements mirror correctly
   - Check slider direction, toggle positions, button alignment
   - Test with existing RTL utilities in the app
6. Implement locale-aware time formatting:
   - Use `moment` with locale for time formatting
   - Respect 12/24 hour preference if available
   - Format prayer times consistently with rest of app
7. Test language switching:
   - Switch between English and Arabic
   - Verify notifications reschedule with new language
   - Verify all UI updates immediately

---

### Task 10: Testing and Quality Assurance
**Description**: Implement comprehensive testing strategy for the adhan reminders feature covering unit tests, integration tests, and manual testing.

**⚠️ CRITICAL REQUIREMENTS**:
- ✅ **Physical device testing is MANDATORY** (not optional)
- ✅ Test on real Android 13+ device (exact alarms, Doze mode)
- ✅ Test on real iOS 15+ device (notification sounds, background limits)
- ✅ Test with app closed (swiped away), not just background
- ✅ Test with battery saver enabled
- ✅ Test multi-day operation (2-3 days minimum)
- ❌ **NO emulator-only testing** - emulators don't simulate real notification behavior

**Why Physical Devices Matter**:
- Emulators don't support real push notifications
- Android Doze mode only works on real devices
- Battery optimization varies by device manufacturer
- Notification sounds behave differently on real devices
- Background/killed app states work differently

**Acceptance Criteria**:
- Unit tests cover all notification service functions with edge cases
- Integration tests verify end-to-end notification flow from scheduling to delivery
- UI component tests ensure settings interactions work correctly
- **Manual testing on physical devices confirms notification delivery** (CRITICAL)
- **Notifications arrive within 30 seconds of scheduled time** on physical devices
- **Short alert plays** when notification arrives
- **Full adhan plays** when user taps notification  
- Performance testing confirms no memory leaks or battery drain
- Cross-platform testing on iOS and Android
- Localization testing in both languages
- Test coverage meets project standards (aim for >80%)

**Test Cases**:
- **Notification Service**:
  - Permission request and check functions work correctly
  - Scheduling function creates notifications with correct triggers
  - Cancellation functions properly remove scheduled notifications
  - Error handling works for all failure scenarios
- **Permission Handling**:
  - Permission granted scenario works end-to-end
  - Permission denied scenario shows appropriate UI and doesn't crash
  - Permission prompt appears at correct times
- **Audio Playback**:
  - Adhan audio plays at correct volume
  - Audio stops properly without memory leaks
  - Volume changes take effect immediately
- **Settings Persistence**:
  - All notification settings save and load correctly
  - Settings survive app restart
  - Invalid settings are rejected gracefully
- **Notification Delivery**:
  - Notifications arrive at correct times (test with short intervals)
  - Notifications display localized content
  - Tapping notifications opens app correctly
  - Adhan plays when notification is received
- **Edge Cases**:
  - No location set scenario
  - Location change during scheduled notifications
  - Day change triggers rescheduling
  - Multiple rapid setting changes
  - App backgrounded/killed scenarios

**Implementation Steps**:
1. Create unit test file `__tests__/utils/NotificationService.test.js`:
   - Mock `expo-notifications` API
   - Test permission request flow
   - Test scheduling with various inputs
   - Test cancellation logic
   - Test error handling paths
   - Use Jest assertions and mocking
2. Create integration test file `__tests__/integration/NotificationFlow.test.js`:
   - Test complete flow from settings to notification
   - Test notification rescheduling on location change
   - Test adhan playback trigger
   - Mock AsyncStorage and location services
3. Update existing settings screen tests in `__tests__/screens/UnifiedPrayerSettingsScreen.test.js`:
   - Add tests for new notification settings UI
   - Test timing picker interactions
   - Test adhan toggle and volume slider
   - Test save/discard logic with new settings
   - Test RTL layout rendering
4. Create adhan audio test file `__tests__/utils/AdhanAudio.test.js`:
   - Test audio player initialization
   - Test volume control
   - Test playback and stop functions
   - Test AsyncStorage integration for volume
   - Mock `expo-audio` API
5. Manual testing checklist (physical devices):
   - **iOS Testing**:
     - Test on iOS 13+ devices
     - Verify notification permissions flow
     - Test notification delivery in foreground/background/killed states
     - Test adhan audio playback quality
     - Test notification sounds and vibration
   - **Android Testing**:
     - Test on Android 8.0+ devices
     - Verify notification channel setup
     - Test notification delivery in all app states
     - Test adhan audio playback
     - Test battery optimization scenarios
   - **Cross-Platform**:
     - Test language switching
     - Test RTL layout in Arabic mode
     - Test location changes
     - Test app updates and data migration
     - Test edge cases (airplane mode, DND mode, etc.)
6. Performance testing:
   - Monitor memory usage during audio playback
   - Check for memory leaks using React DevTools
   - Verify no excessive background wake-ups
   - Test battery drain over 24 hours
   - Profile app startup time impact
7. Automated testing:
   - Run full test suite: `yarn test:coverage`
   - Ensure coverage >80% for new code
   - Fix any failing tests
   - Add tests for any bugs discovered
8. Create testing documentation:
   - Document test scenarios
   - Document known issues and limitations
   - Create troubleshooting guide for common issues

---

## Implementation Order and Dependencies

### Phase 1: Foundation (Tasks 1-3)
1. **Task 1**: Setup Dependencies and Configuration
   - Required first as all other tasks depend on `expo-notifications`
   - Sets up permissions needed for testing
2. **Task 2**: Add Adhan Audio Assets  
   - Can be done in parallel with Task 1
   - Needed before Tasks 4 and 6
3. **Task 3**: Create Notification Service
   - Depends on Task 1 completion
   - Required for Tasks 6, 7, and 8

### Phase 2: Core Features (Tasks 4-6)
4. **Task 4**: Extend Audio System for Adhan
   - Depends on Task 2 (audio files)
   - Needed before Task 6 (notification handler)
5. **Task 5**: Enhance Settings Screen
   - Can start after Phase 1
   - Provides UI for features in Task 6
6. **Task 6**: Implement Notification Scheduling Logic
   - Depends on Tasks 3, 4, and 5
   - Core business logic for the feature

### Phase 3: Integration (Tasks 7-9)
7. **Task 7**: App Initialization Integration
   - Depends on Tasks 3, 4, and 6
   - Brings everything together in app lifecycle
8. **Task 8**: Add Notification Management UI
   - Depends on Task 7
   - Provides debugging and user management tools
9. **Task 9**: Localization and RTL Support
   - Can be done incrementally with Tasks 5, 6, 7, 8
   - Final polish to ensure quality

### Phase 4: Quality Assurance (Task 10)
10. **Task 10**: Testing and Quality Assurance
    - Ongoing throughout development
    - Final comprehensive testing after all features complete

## Risk Assessment and Mitigation

### 🔴 Critical High Risk (Must Address)

- **Background Audio Playback Limitations** ⚠️⚠️⚠️
  - *Risk*: iOS/Android restrict long audio (60-120s) in background notifications
  - *Impact*: Full adhan won't play automatically, App Store may reject
  - *Mitigation*: **Changed approach** - short alert in notification, full adhan on tap only
  - *Status*: ✅ Addressed in updated implementation plan

- **Android Doze Mode / Exact Alarms** ⚠️⚠️
  - *Risk*: Notifications delayed 15-30 minutes without exact alarm permission
  - *Impact*: Prayer time reminders arrive late (unacceptable for Fajr)
  - *Mitigation*: Request SCHEDULE_EXACT_ALARM and USE_EXACT_ALARM permissions
  - *Mitigation*: Provide battery optimization guidance in UI
  - *Status*: ✅ Added to Task 1 and Task 3

- **iOS App Store Policies** ⚠️⚠️
  - *Risk*: Auto-triggered religious audio may violate guidelines
  - *Impact*: App rejection during review
  - *Mitigation*: Full adhan only plays on user tap (not automatic)
  - *Mitigation*: Clear documentation for App Review
  - *Status*: ✅ Conservative approach implemented

- **Build Process (expo prebuild)** ⚠️⚠️
  - *Risk*: prebuild --clean can break Firebase and custom configs
  - *Impact*: App won't build, loss of configuration
  - *Mitigation*: Backup native directories BEFORE prebuild
  - *Mitigation*: Verify Google Services files after prebuild
  - *Status*: ✅ Added to Task 1 procedures

### 🟡 Medium Risk

- **Notification permissions denied by user**
  - *Mitigation*: Clear messaging about why permissions are needed, graceful degradation, instructions for enabling in settings
  - *Fallback*: Allow manual checking of prayer times without notifications
  
- **Background notification reliability varies by device**
  - *Mitigation*: Test on multiple devices and OS versions, use expo-notifications best practices
  - *Documentation*: Provide user guidance for battery optimization settings

### Medium Risk
- **Audio file size impacting app bundle size**
  - *Mitigation*: Compress audio files to 128kbps, target <2MB per file, consider on-demand download
  - *Monitoring*: Track app bundle size during development

- **Different notification behaviors on iOS vs Android**
  - *Mitigation*: Thorough testing on both platforms, platform-specific handling where needed
  - *Testing*: Maintain test devices for both platforms

- **Prayer time changes not triggering rescheduling**
  - *Mitigation*: Implement robust daily rescheduling logic, test day transitions thoroughly
  - *Fallback*: Manual reschedule option in settings

### Low Risk
- **Scheduling conflicts with other app notifications**
  - *Mitigation*: Use unique notification IDs, proper channel management on Android
  
- **Audio playback interfering with other apps**
  - *Mitigation*: Use proper audio categories, respect system audio settings

- **Localization issues with notification content**
  - *Mitigation*: Comprehensive localization testing, native speaker review

## Success Metrics

### Functional Requirements ✅
- [ ] Users can enable/disable notifications globally and per-prayer
- [ ] **Notifications arrive at correct times (within 30 seconds accuracy)** on physical devices
- [ ] **Short alert plays** when notification arrives
- [ ] **Full adhan plays** when user taps notification (not automatic)
- [ ] **Works with app closed** (swiped away), not just background
- [ ] **Exact alarm permission** requested and granted on Android 12+
- [ ] Settings persist correctly across app restarts
- [ ] Feature works on iOS 15+ and Android 13+
- [ ] RTL layout works correctly in Arabic mode
- [ ] All UI is properly localized in both languages
- [ ] Rescheduling works automatically after day change

### Performance Requirements ✅
- [ ] Notification scheduling completes in <500ms
- [ ] App startup time increases by <200ms
- [ ] Audio playback starts within 1 second
- [ ] No memory leaks during extended use
- [ ] Battery drain increase <5% over 24 hours

### User Experience Requirements ✅
- [ ] Permission request flow is clear and non-intrusive
- [ ] Settings are intuitive and easy to configure
- [ ] Error messages are helpful and actionable
- [ ] Test features help users verify functionality
- [ ] Feature works seamlessly with existing app features

### Quality Requirements ✅
- [ ] Test coverage >80% for new code
- [ ] No critical or high-severity bugs in production
- [ ] Documentation is complete and up-to-date
- [ ] Code follows project standards and patterns
- [ ] Accessibility considerations are addressed

### ⚠️ Testing Requirements (Non-Negotiable)
- [ ] **Tested on real Android 13+ device** (not emulator)
- [ ] **Tested on real iOS 15+ device** (not simulator)
- [ ] Tested with app in foreground, background, and closed states
- [ ] Tested with battery saver/optimization enabled
- [ ] Tested with Do Not Disturb mode (should still notify)
- [ ] Tested multi-day operation (minimum 2-3 days)
- [ ] Tested language switching (English ↔ Arabic)
- [ ] Tested location changes and timezone changes
- [ ] Tested on devices with aggressive battery optimization (Samsung, Xiaomi)
- [ ] Tested notification arrives within 30 seconds of prayer time

### App Store Compliance ✅
- [ ] iOS App Store description mentions prayer notifications
- [ ] App Review notes explain user-initiated audio
- [ ] Full adhan only plays when user taps notification
- [ ] No automatic background audio playback
- [ ] Clear permission explanations in UI
- [ ] Privacy manifest updated (iOS)
- [ ] Google Play Store description updated

## Notes and Considerations

- **Existing Sound System**: The app already uses `expo-audio` via the `useAudioPlayer` hook in `utils/Sounds.js`. Follow this pattern for adhan audio.
- **Storage Keys**: Add new keys to `constants/PrayerConstants.js` STORAGE_KEYS object to maintain consistency.
- **UI Patterns**: Follow existing patterns in `UnifiedPrayerSettingsScreen.js` for consistency (CustomToggle, modals, sliders).
- **Prayer Calculations**: The `adhan` library (v4.4.3) is already in use and working well for prayer time calculations.
- **Testing Framework**: Project uses Jest with React Native Testing Library - follow existing test patterns in `__tests__/` directory.
- **Version Compatibility**: Project uses React Native 0.81.4, Expo SDK 54 - ensure `expo-notifications` version is compatible.

---

## 📱 App Store Submission Guidance

### iOS App Store Review Preparation

**App Description Updates**:
```
Zikr - Islamic Prayer Times & Reminders

Features:
• Accurate prayer times based on your location
• Qibla compass for finding prayer direction
• Prayer time notifications with optional Adhan sound
• Support for multiple calculation methods
• Beautiful bilingual interface (English/Arabic)

NEW: Prayer Notifications
Receive timely reminders for each prayer time. Choose to play a short notification alert, and tap the notification to hear the full Adhan recitation.
```

**App Review Information Notes** (submit with your build):
```
Prayer Notification Feature:

1. NOTIFICATION SOUND BEHAVIOR:
   - When a prayer time arrives, the app plays a SHORT notification alert (15-30 seconds)
   - The full Adhan audio (60-120 seconds) ONLY plays when the user taps the notification
   - This is USER-INITIATED audio playback, not automatic background audio
   - Complies with iOS guidelines for notification sounds and user-initiated content

2. PERMISSIONS REQUIRED:
   - Notifications: Required to send prayer time reminders
   - Location: Required to calculate accurate prayer times based on user's location
   - All permissions include clear explanations shown to users

3. TESTING THE FEATURE:
   - Open app → Settings → Prayer Notifications
   - Grant notification permission
   - Enable notifications for desired prayers
   - Test by sending a test notification
   - Tap the test notification to hear the full Adhan

4. RELIGIOUS CONTENT:
   - The Adhan (Islamic call to prayer) is a core religious practice
   - Audio is optional - users can enable/disable
   - Respects user's religious preferences and notification settings
```

**NSUserNotificationsUsageDescription** (already in app.config.js):
```
"Zikr needs notification permission to remind you of prayer times. You can customize which prayers to be notified about in the app settings."
```

**Privacy Manifest** (if required):
- Declare notification usage
- Explain location usage for prayer time calculation
- No user tracking or data collection

### Google Play Store Submission

**App Description Updates**:
```
Zikr - Islamic Prayer Times & Qibla

What's New:
• Prayer time notifications - never miss a prayer
• Choose notification timing (at prayer time or minutes before)
• Optional Adhan sound with customizable volume
• Precise timing with Android 12+ exact alarm support
• Battery optimization guidance for reliable notifications

Features:
• Accurate prayer times based on GPS location
• Qibla compass with multiple calculation methods
• Customizable notifications for each prayer
• Full Arabic and English support with RTL
• Multiple calculation methods
```

**Permission Explanations** (Google Play Console):

1. **POST_NOTIFICATIONS** (Android 13+):
   - Purpose: "Send prayer time reminder notifications"
   - User-facing: "To notify you when it's time for prayer"

2. **SCHEDULE_EXACT_ALARM** (Android 12+):
   - Purpose: "Schedule notifications at precise prayer times"
   - User-facing: "Prayer times must be exact - this ensures notifications arrive on time without delays"

3. **USE_EXACT_ALARM** (Android 14+):
   - Purpose: "Required for time-sensitive prayer notifications"
   - User-facing: "Ensures prayer reminders arrive at the correct Islamic prayer time"

4. **ACCESS_FINE_LOCATION**:
   - Purpose: "Calculate accurate prayer times based on geographic location"
   - User-facing: "Prayer times vary by location - we need your coordinates to calculate the correct times"

**Data Safety Section** (Play Console):
```
Location:
- Collected: Yes
- Purpose: Calculate prayer times based on user's location
- Shared: No
- Can be deleted: Yes (clear app data)

Personal Info:
- Collected: No

App Activity:
- Collected: No (if you're not using Analytics for personal data)
```

### Pre-Submission Checklist

**iOS Specific**:
- [ ] NSUserNotificationsUsageDescription in infoPlist
- [ ] UIBackgroundModes includes "audio" (if playing from background)
- [ ] Test on physical iOS device (15+)
- [ ] Verify notification sound is <30 seconds
- [ ] Full adhan only plays on notification tap (user-initiated)
- [ ] Test with Do Not Disturb mode
- [ ] Test with Focus modes
- [ ] Screenshots show notification settings clearly
- [ ] App review notes explain audio behavior

**Android Specific**:
- [ ] POST_NOTIFICATIONS permission (Android 13+)
- [ ] SCHEDULE_EXACT_ALARM permission (Android 12+)
- [ ] USE_EXACT_ALARM permission (Android 14+)
- [ ] Clear permission explanations in Play Console
- [ ] Test on physical Android device (13+)
- [ ] Test with battery saver enabled
- [ ] Test with different OEMs (Samsung, Xiaomi, etc.)
- [ ] Verify exact alarm permission granted
- [ ] Test Doze mode behavior (leave idle 30+ min)
- [ ] Screenshots show permission prompts

**Both Platforms**:
- [ ] App description mentions notifications feature
- [ ] Privacy policy updated (if you have one)
- [ ] Test multi-day operation (2-3 days minimum)
- [ ] Test language switching (English ↔ Arabic)
- [ ] Test all 5 prayer time notifications
- [ ] Test with app closed (swiped away)
- [ ] No crashes or ANRs in crash reporting
- [ ] Version number incremented properly

### Common App Review Rejection Reasons (and how to avoid them)

**iOS**:
1. **"App plays audio in background without user initiation"**
   - ✅ **AVOIDED**: Full adhan only plays when user taps notification
   
2. **"Notification sound exceeds 30 seconds"**
   - ✅ **AVOIDED**: Notification uses short alert (15-30s), full adhan is tap-to-play

3. **"App crashes when notification permission denied"**
   - ✅ **AVOIDED**: Graceful handling in NotificationService

4. **"Missing permission usage description"**
   - ✅ **AVOIDED**: NSUserNotificationsUsageDescription added in Task 1

**Android**:
1. **"Dangerous permission without clear justification"**
   - ✅ **AVOIDED**: Clear explanations in Play Console and in-app UI

2. **"Exact alarm permission misuse"**
   - ✅ **AVOIDED**: Clear user-facing explanation of why it's needed

3. **"Background location access"**
   - ✅ **NOT APPLICABLE**: We don't need background location

4. **"Battery drain concerns"**
   - ✅ **AVOIDED**: Provide battery optimization guidance to users

### Post-Submission Monitoring

**First Week After Release**:
- Monitor crash reports (Firebase Crashlytics, Sentry, etc.)
- Check user reviews for notification-related issues
- Watch for "notifications not arriving" complaints
- Monitor battery drain reports
- Check permission grant rates in analytics

**Key Metrics to Track**:
- Notification permission grant rate (target: >60%)
- Exact alarm permission grant rate - Android (target: >80%)
- Notification delivery success rate (via analytics)
- App uninstall rate after enabling notifications
- User feedback sentiment about notification feature

---</content>
<parameter name="filePath">d:\Valabji\Desktop\Projects\Zikr\docs\ADHAN_REMINDERS_IMPLEMENTATION.md