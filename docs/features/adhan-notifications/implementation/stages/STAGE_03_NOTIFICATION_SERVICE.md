# Stage 3: Notification Service Core

**Stage**: 3 of 10  
**Estimated Time**: 3 hours  
**Complexity**: Hard  
**Prerequisites**: Stages 1-2 complete (dependencies + audio assets)

---

## 🎯 Objective

Create the core notification service that handles:
- Android exact alarm scheduling (CRITICAL for precise prayer times)
- Notification permissions (iOS/Android)
- Battery optimization detection and guidance
- Opening system settings for exact alarms

This is the foundation for all notification functionality.

---

## 📋 Tasks Checklist

- [ ] Create NotificationService.js utility file
- [ ] Implement requestPermissions() for iOS/Android
- [ ] Implement scheduleExactNotification() with exact alarms
- [ ] Implement checkExactAlarmPermission() (Android)
- [ ] Implement openExactAlarmSettings() (Android)
- [ ] Implement checkBatteryOptimization() (Android)
- [ ] Implement openBatterySettings() (Android)
- [ ] Implement cancelNotification() and cancelAllNotifications()
- [ ] Add comprehensive error handling
- [ ] Test on physical Android device

---

## 🚨 CRITICAL Android Requirements

**Why Exact Alarms Matter**:
- WITHOUT exact alarms: Notifications delayed 15-30 minutes (useless for prayer times!)
- WITH exact alarms: Notifications fire within 1-2 seconds of scheduled time

**Android 12+ (API 31+)**: Requires explicit permission for exact alarms  
**Android 14+ (API 34+)**: Even stricter requirements

**This stage is CRITICAL** - if exact alarms don't work, the entire feature fails.

---

## 📁 File to Create

**Location**: `utils/NotificationService.js`

**Purpose**: Centralized service for all notification operations

**Current Status**: Does not exist - you will create it

---

## 🔨 Step 1: Create NotificationService.js

### Create the File

**Location**: `utils/NotificationService.js`

```javascript
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * NotificationService - Handles all notification operations for adhan reminders
 * 
 * CRITICAL: Android 12+ requires exact alarm permissions for precise timing
 * WITHOUT exact alarms, notifications can be delayed by 15-30 minutes!
 * 
 * Key Features:
 * - Request notification permissions (iOS/Android)
 * - Schedule exact notifications (Android exact alarms)
 * - Check exact alarm permission status
 * - Open system settings for exact alarms
 * - Check battery optimization status
 * - Cancel notifications
 */
class NotificationService {
  constructor() {
    // Set notification handler (how notifications appear)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,  // We'll play custom audio separately
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Request notification permissions
   * iOS: Shows system permission dialog
   * Android: Automatically granted on install, but we verify
   * 
   * @returns {Object} { granted: boolean, ios: object, android: object }
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If not determined, request permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return {
          granted: false,
          message: 'Notification permission denied. Please enable in Settings.',
        };
      }

      // Android: Check exact alarm permission (CRITICAL)
      if (Platform.OS === 'android') {
        const hasExactAlarmPermission = await this.checkExactAlarmPermission();
        
        if (!hasExactAlarmPermission) {
          return {
            granted: true,
            exactAlarmGranted: false,
            message: 'Exact alarm permission required for precise prayer time notifications.',
            needsExactAlarm: true,
          };
        }

        return {
          granted: true,
          exactAlarmGranted: true,
          message: 'All permissions granted',
        };
      }

      // iOS: All set
      return {
        granted: true,
        message: 'Notification permission granted',
      };

    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if app has exact alarm permission (Android 12+)
   * 
   * @returns {boolean} True if permission granted or not required
   */
  async checkExactAlarmPermission() {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this
    }

    try {
      // Android 12+ (API 31+) requires explicit permission
      if (Platform.Version >= 31) {
        const hasPermission = await Notifications.checkPermissionsAsync();
        
        // Check if we can schedule exact alarms
        // Note: Exact alarm permission is separate from notification permission
        // We'll verify by attempting to get scheduling info
        const canScheduleExact = hasPermission.status === 'granted';
        
        return canScheduleExact;
      }

      // Android 11 and below: exact alarms work by default
      return true;

    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Open system settings for exact alarm permission (Android 12+)
   * User must manually enable "Alarms & reminders" permission
   */
  async openExactAlarmSettings() {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Required', 'Exact alarms are only needed on Android.');
      return;
    }

    try {
      // Android 12+ (API 31+): Open exact alarm settings
      if (Platform.Version >= 31) {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
          {
            data: 'package:com.yourcompany.zikr', // Replace with your package name
          }
        );
      } else {
        Alert.alert(
          'Not Required',
          'Your Android version does not require exact alarm permission.'
        );
      }
    } catch (error) {
      console.error('Error opening exact alarm settings:', error);
      
      // Fallback: Open app info settings
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.yourcompany.zikr', // Replace with your package name
          }
        );
      } catch (fallbackError) {
        console.error('Error opening app settings:', fallbackError);
        Alert.alert(
          'Error',
          'Could not open settings. Please manually go to Settings > Apps > Zikr > Permissions'
        );
      }
    }
  }

  /**
   * Check if app is affected by battery optimization (Android)
   * Battery optimization can delay or prevent notifications
   * 
   * @returns {boolean} True if battery optimization is enabled (bad)
   */
  async checkBatteryOptimization() {
    if (Platform.OS !== 'android') {
      return false; // iOS doesn't have this issue
    }

    try {
      // We can't directly check battery optimization status with Expo
      // Instead, we'll check if notifications are being delayed
      // Store the last notification time and compare
      const lastCheck = await AsyncStorage.getItem('lastBatteryCheck');
      const now = Date.now();
      
      if (!lastCheck) {
        await AsyncStorage.setItem('lastBatteryCheck', now.toString());
        return false; // First time, assume not optimized
      }

      // If it's been more than 24 hours, suggest checking battery settings
      const hoursSinceCheck = (now - parseInt(lastCheck)) / (1000 * 60 * 60);
      return hoursSinceCheck > 24;

    } catch (error) {
      console.error('Error checking battery optimization:', error);
      return false;
    }
  }

  /**
   * Open battery optimization settings (Android)
   * User should disable battery optimization for the app
   */
  async openBatterySettings() {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Applicable', 'Battery optimization is Android-specific.');
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
      
      Alert.alert(
        'Disable Battery Optimization',
        'Find "Zikr" in the list and select "Don\'t optimize" to ensure reliable notifications.'
      );

    } catch (error) {
      console.error('Error opening battery settings:', error);
      
      // Fallback: Open app info
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          {
            data: 'package:com.yourcompany.zikr', // Replace with your package name
          }
        );
      } catch (fallbackError) {
        Alert.alert(
          'Error',
          'Could not open settings. Please manually go to Settings > Battery > Battery optimization'
        );
      }
    }
  }

  /**
   * Schedule an exact notification at a specific time
   * Uses Android exact alarms for precise timing (CRITICAL)
   * 
   * @param {string} id - Unique notification ID (e.g., 'fajr', 'dhuhr')
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Date} triggerDate - Exact time to trigger
   * @param {string} sound - Audio file to play ('short' or 'full')
   * @returns {string|null} Notification ID if successful, null if failed
   */
  async scheduleExactNotification(id, title, body, triggerDate, sound = 'short') {
    try {
      // Validate trigger date
      if (!(triggerDate instanceof Date) || triggerDate.getTime() <= Date.now()) {
        console.error('Invalid trigger date:', triggerDate);
        return null;
      }

      // Cancel existing notification with same ID
      await this.cancelNotification(id);

      // Prepare notification content
      const content = {
        title,
        body,
        sound: false, // We'll play custom audio separately
        data: {
          notificationId: id,
          soundType: sound, // 'short' or 'full'
          scheduledTime: triggerDate.getTime(),
        },
        priority: 'high',
        categoryIdentifier: 'prayer_reminder',
      };

      // Prepare trigger with exact timing
      const trigger = {
        date: triggerDate,
        repeats: false,
        // CRITICAL: For Android, this ensures exact timing
        channelId: 'prayer_reminders', // Must match channel created later
      };

      // Schedule notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: id,
        content,
        trigger,
      });

      console.log(`✅ Scheduled notification "${id}" for ${triggerDate.toLocaleString()}`);
      return notificationId;

    } catch (error) {
      console.error(`Error scheduling notification "${id}":`, error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   * 
   * @param {string} id - Notification ID to cancel
   */
  async cancelNotification(id) {
    try {
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find notification with matching identifier
      const notification = scheduled.find(n => n.identifier === id);
      
      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`❌ Cancelled notification: ${id}`);
      }
    } catch (error) {
      console.error(`Error cancelling notification "${id}":`, error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all currently scheduled notifications
   * Useful for debugging
   * 
   * @returns {Array} Array of scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Create notification channel (Android only)
   * MUST be called before scheduling any notifications on Android
   * 
   * @param {string} id - Channel ID
   * @param {string} name - Channel name (shown to user)
   * @param {string} description - Channel description
   */
  async createNotificationChannel(id, name, description) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(id, {
        name,
        description,
        importance: Notifications.AndroidImportance.MAX, // Highest priority
        sound: false, // We'll play custom audio
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Show even in Do Not Disturb mode
      });
      console.log(`✅ Created notification channel: ${id}`);
    }
  }
}

// Export singleton instance
export default new NotificationService();
```

---

## ⚙️ Step 2: Update Package Name

**IMPORTANT**: The code above contains placeholder package names. Update them:

### Find Your Package Name

**Android**: Open `app.config.js`, find `android.package`

**Example**:
```javascript
android: {
  package: "com.yourcompany.zikr",  // This is your package name
}
```

### Replace in NotificationService.js

Search for all instances of `'package:com.yourcompany.zikr'` and replace with your actual package name.

**There are 3 instances to replace**:
1. Line ~146 (openExactAlarmSettings)
2. Line ~156 (openExactAlarmSettings fallback)
3. Line ~222 (openBatterySettings fallback)

---

## ✅ Step 3: Verify File Creation

```bash
# Check file exists
# Windows:
dir utils\NotificationService.js

# Mac/Linux:
ls -l utils/NotificationService.js
```

**Expected**: File exists, ~450 lines of code

---

## 📁 Project Structure After This Stage

```
Zikr/
├── utils/
│   ├── FontSize.js              # Existing
│   ├── load.js                  # Existing
│   ├── PrayerUtils.js           # Existing
│   ├── Sounds.js                # Existing (will be updated in Stage 4)
│   ├── NotificationService.js   # ✅ NEW (this stage)
│   └── ... other utils
└── ... rest of project
```

---

## 🧪 Step 4: Test Notification Service

### Create Test Component

**Create**: `components/NotificationTest.js` (temporary)

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import NotificationService from '../utils/NotificationService';

export default function NotificationTest() {
  const [status, setStatus] = useState('Not checked');
  const [scheduled, setScheduled] = useState([]);

  const testPermissions = async () => {
    const result = await NotificationService.requestPermissions();
    setStatus(JSON.stringify(result, null, 2));
    
    if (result.needsExactAlarm) {
      Alert.alert(
        'Exact Alarm Required',
        'Android 12+ requires exact alarm permission for precise timing. Open settings?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => NotificationService.openExactAlarmSettings() },
        ]
      );
    }
  };

  const testSchedule = async () => {
    // Schedule test notification 10 seconds from now
    const triggerDate = new Date(Date.now() + 10000);
    const id = await NotificationService.scheduleExactNotification(
      'test_notification',
      'Test Notification',
      'This notification was scheduled 10 seconds ago',
      triggerDate,
      'short'
    );
    
    if (id) {
      Alert.alert('Success', `Notification scheduled for ${triggerDate.toLocaleTimeString()}`);
      getScheduled();
    } else {
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const getScheduled = async () => {
    const notifications = await NotificationService.getScheduledNotifications();
    setScheduled(notifications);
  };

  const cancelAll = async () => {
    await NotificationService.cancelAllNotifications();
    Alert.alert('Success', 'All notifications cancelled');
    getScheduled();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Service Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testPermissions}>
        <Text style={styles.buttonText}>Check Permissions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testSchedule}>
        <Text style={styles.buttonText}>Schedule Test (10 sec)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={getScheduled}>
        <Text style={styles.buttonText}>View Scheduled</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={cancelAll}>
        <Text style={styles.buttonText}>Cancel All</Text>
      </TouchableOpacity>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
        
        <Text style={styles.statusTitle}>Scheduled ({scheduled.length}):</Text>
        {scheduled.map((n, i) => (
          <Text key={i} style={styles.statusText}>
            {n.identifier}: {new Date(n.trigger.value).toLocaleString()}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  dangerButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16 },
  statusContainer: { marginTop: 20, padding: 10, backgroundColor: '#f0f0f0' },
  statusTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  statusText: { fontSize: 12, marginTop: 5 },
});
```

### Add to App Temporarily

**Edit**: `App.js` (root level)

```javascript
// Add import at top
import NotificationTest from './components/NotificationTest';

// Inside return statement, add:
<NotificationTest />
```

### Run Tests

```bash
npx expo run:android  # MUST use physical device
```

**Test Sequence**:
1. Click "Check Permissions"
   - Should request notification permission
   - Android 12+: Should detect missing exact alarm permission
2. If prompted, click "Open Settings"
   - Settings should open to exact alarm screen
   - Enable "Alarms & reminders" for Zikr
   - Return to app
3. Click "Check Permissions" again
   - Should show all permissions granted
4. Click "Schedule Test (10 sec)"
   - Should schedule notification for 10 seconds from now
5. Wait 10 seconds
   - Notification should appear EXACTLY on time
6. Click "View Scheduled"
   - Should show scheduled notifications

**Expected Results**:
- ✅ Permissions granted (both notification + exact alarm)
- ✅ Test notification appears exactly 10 seconds after scheduling
- ✅ "View Scheduled" shows correct notifications
- ✅ "Cancel All" removes all notifications

**If notification is delayed >5 seconds**: Exact alarms NOT working - check permission again

### Remove Test Code

```bash
# Windows:
del components\NotificationTest.js

# Mac/Linux:
rm components/NotificationTest.js
```

Remove `<NotificationTest />` from `App.js`

---

## ✅ Acceptance Criteria

Before moving to Stage 4, verify:

- [ ] NotificationService.js created in utils/
- [ ] All package names updated to actual package
- [ ] requestPermissions() works on iOS and Android
- [ ] checkExactAlarmPermission() detects status correctly (Android 12+)
- [ ] openExactAlarmSettings() opens correct settings screen
- [ ] scheduleExactNotification() schedules notifications
- [ ] Test notification appears within 2 seconds of scheduled time
- [ ] cancelNotification() and cancelAllNotifications() work
- [ ] getScheduledNotifications() returns correct list
- [ ] Test component removed

---

## 🐛 Common Issues and Solutions

### Issue 1: Notification Delayed 15-30 Minutes

**Symptoms**: Test notification doesn't appear on time

**Solutions**:
1. Check exact alarm permission: Settings > Apps > Zikr > Alarms & reminders (ENABLED)
2. Disable battery optimization: Settings > Battery > Battery optimization > Zikr (Don't optimize)
3. Restart device after changing settings
4. Android 14+: Check "Use exact alarm" permission specifically

### Issue 2: "Cannot Schedule Exact Alarm" Error

**Symptoms**: Error when calling scheduleExactNotification()

**Solutions**:
1. Verify permissions in AndroidManifest.xml:
   ```bash
   grep "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml
   ```
2. Re-run prebuild if permission missing:
   ```bash
   npx expo prebuild --clean
   ```
3. Check Android version: `Platform.Version >= 31`

### Issue 3: Settings Won't Open

**Symptoms**: openExactAlarmSettings() doesn't work

**Solutions**:
1. Verify package name is correct in NotificationService.js
2. Check expo-intent-launcher is installed: `grep "expo-intent-launcher" package.json`
3. Try fallback: Manually go to Settings > Apps > Zikr

### Issue 4: Permissions Show "Granted" But Don't Work

**Symptoms**: Permissions appear granted but notifications still delayed

**Solutions**:
1. This is a battery optimization issue, not permissions
2. Open battery settings: `NotificationService.openBatterySettings()`
3. Find Zikr, select "Don't optimize"
4. Restart device

---

## 📝 Verification Commands

```bash
# Check file exists
ls -l utils/NotificationService.js

# Check package name in config
grep "package:" app.config.js

# Check permissions in manifest (after prebuild)
grep "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml

# Verify dependency installed
grep "expo-intent-launcher" package.json
```

---

## ➡️ Next Stage

**Stage 4**: Audio System Integration
- Update Sounds.js to support two audio players
- Integrate with NotificationService
- Handle audio playback from notifications
- Test audio + notification together

**Location**: `stages/STAGE_04_AUDIO_SYSTEM.md`

---

**Stage 3 Complete!** ✅  
Core notification service is ready with exact alarm support. Proceed to Stage 4.
