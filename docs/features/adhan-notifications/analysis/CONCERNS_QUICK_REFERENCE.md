# Developer Concerns - Quick Reference Guide

## 🟢 Low Risk (Already Handled by Your Project)

| Concern | Status | Why It's Not a Problem |
|---------|--------|----------------------|
| **Expo/expo-audio conflicts** | ✅ Safe | Already using expo-audio successfully on SDK 54 |
| **RTL/Localization** | ✅ Safe | Sophisticated RTL system already implemented |
| **Audio memory leaks** | ✅ Safe | Clean hook-based architecture already in place |

**Action**: Follow existing patterns, no special concerns.

---

## 🟡 Medium Risk (Needs Attention)

### 1. Missing Notification Permissions ⚠️

**Problem**: Config files missing iOS and Android notification permissions.

**Fix for Task 1**:
```javascript
// app.config.js - iOS
ios: {
  infoPlist: {
    NSUserNotificationsUsageDescription: "Prayer time reminders with optional Adhan audio",
    UIBackgroundModes: ["audio", "remote-notification"]
  }
}

// app.config.js - Android  
android: {
  permissions: [
    "android.permission.POST_NOTIFICATIONS",      // Android 13+
    "android.permission.SCHEDULE_EXACT_ALARM",    // For precise timing
    "android.permission.USE_EXACT_ALARM"          // Android 14+
  ]
}
```

### 2. Notification Channel Setup ⚠️

**Problem**: Must configure correctly first time (can't easily change later).

**Fix for Task 7**:
```javascript
// App.js initialization
Notifications.setNotificationChannelAsync('prayer-times', {
  name: 'Prayer Times',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'adhan_short.mp3',
  vibrationPattern: [0, 250, 250, 250],
});
```

### 3. Daily Rescheduling ⚠️

**Problem**: Prayer times change daily, need robust scheduling.

**Fix for Task 6**:
```javascript
// Always cancel all before rescheduling
await Notifications.cancelAllScheduledNotificationsAsync();

// Schedule today's remaining + tomorrow's prayers
// Add "last scheduled date" tracking for detection
```

### 4. AsyncStorage Race Conditions ⚠️

**Problem**: Multiple simultaneous writes to same storage keys.

**Fix for Task 5**:
```javascript
// Store all notification settings as single object
const notificationSettings = {
  enabled: true,
  minutesBefore: 5,
  adhanEnabled: true,
  adhanVolume: 0.8,
  notificationTimes: { /* per-prayer settings */ }
};

await AsyncStorage.setItem(
  '@prayer_notification_settings',
  JSON.stringify(notificationSettings)
);
```

### 5. Timezone/Location Changes ⚠️

**Problem**: Prayer times shift when user travels.

**Fix for Task 7**:
```javascript
// Reschedule on app foreground
AppState.addEventListener('change', async (nextAppState) => {
  if (nextAppState === 'active') {
    await checkLocationAndReschedule();
  }
});

// Optionally: monitor significant location changes (>30km)
```

---

## 🔴 High Risk (Critical Attention Required)

### 1. Background Adhan Playback ⚠️⚠️⚠️

**Problem**: iOS/Android restrict long audio in background notifications.

**CRITICAL DECISION REQUIRED**:

❌ **Don't Do This** (Will cause problems):
- Auto-play full 60-120s adhan when notification arrives
- Expect background audio to work reliably
- May violate App Store policies

✅ **Do This Instead** (Recommended):
- Play **short alert sound** (15-30s) when notification arrives
- Show notification: "Fajr Prayer Time - Tap to hear Adhan"
- Play **full adhan** only when user taps notification (app opens)

**Benefits**:
- Works reliably on all devices
- Passes App Store review
- Better battery life
- User controls audio playback

**Implementation**:
```javascript
// Task 2: Need TWO audio files
assets/sound/
  ├── adhan_short.mp3   (15-30s, ~300 KB) - for notification
  └── adhan_full.mp3    (60-120s, ~800 KB) - for in-app

// Task 6: Notification uses short sound
{
  title: "Fajr Prayer Time",
  body: "Tap to hear the Adhan",
  sound: 'adhan_short.mp3',
  data: { playFullAdhan: true }
}

// Task 7: Full adhan only on tap
Notifications.addNotificationResponseReceivedListener(response => {
  if (response.notification.request.content.data.playFullAdhan) {
    playFullAdhan(); // Now in foreground, safe to play
  }
});
```

### 2. Android Doze Mode ⚠️⚠️

**Problem**: Scheduled notifications can be delayed 15-30 minutes.

**Critical for prayer times** (Fajr especially).

**Fix for Task 1 & 3**:
```javascript
// app.config.js - Add exact alarm permissions
android: {
  permissions: [
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.USE_EXACT_ALARM"
  ]
}

// NotificationService.js - Request permission at runtime
const requestExactAlarmPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    // Open system settings for user to enable
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
    );
  }
};

// Schedule with exact trigger
await Notifications.scheduleNotificationAsync({
  trigger: {
    type: 'date',
    date: prayerTime,
    exact: true  // Force exact timing
  }
});
```

### 3. Build Process (Prebuild) ⚠️⚠️⚠️

**Problem**: `expo prebuild --clean` can break Firebase and custom configs.

**BEFORE running prebuild**:
```bash
# 1. Backup everything
cp -r android android_backup
cp -r ios ios_backup
cp google-services.json google-services.json.backup

# 2. Commit to git
git add .
git commit -m "Pre-notification-feature backup"

# 3. Install dependency
yarn add expo-notifications@~0.28.19

# 4. Update app.config.js with all permissions

# 5. Run prebuild
expo prebuild --clean

# 6. Verify Google Services files
ls -la android/app/google-services.json
ls -la ios/GoogleService-Info.plist

# 7. Test build immediately
yarn android
yarn ios

# 8. If anything fails, restore from backup
```

### 4. App Store Policy (iOS) ⚠️⚠️

**Problem**: Apple sensitive about auto-triggered religious audio.

**Safe Approach**:

1. **Don't** auto-play adhan in background
2. **Do** require user tap to hear full adhan
3. **Do** document clearly for App Review:
   ```
   App Review Notes:
   - Prayer notifications with optional Adhan audio
   - Audio only plays when user taps notification (user-initiated)
   - Fully user-controlled via settings
   - Not automatically triggered in background
   ```

4. **Do** use clear UI text:
   ```javascript
   <Text>
     Notifications will alert you at prayer times.
     Tap a notification to hear the full Adhan.
   </Text>
   ```

### 5. Physical Device Testing ⚠️⚠️

**Problem**: Emulators can't test real notification behavior.

**MANDATORY Testing**:

| Must Test On | Why |
|--------------|-----|
| Real Android device (13+) | POST_NOTIFICATIONS permission, Doze mode |
| Real iOS device (15+) | Notification sounds, background limits |
| Both with app closed | Notification delivery |
| Both with battery saver | Exact alarm behavior |

**Testing Checklist**:
- [ ] Notification appears at exact prayer time
- [ ] Short sound plays correctly
- [ ] Tapping notification opens app and plays full adhan
- [ ] Works when app completely closed (swiped away)
- [ ] Works with battery saver enabled
- [ ] Works with Do Not Disturb (should still notify)
- [ ] Rescheduling works after day changes

**Use EAS Build**:
```bash
eas device:create  # Register test devices
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### 6. App Size (Audio Files) ⚠️

**Problem**: Multiple large audio files increase bundle size.

**Solution**:
- Bundle only 2 files initially:
  - Short alert: ~300 KB (15-30s, 128kbps MP3)
  - One full adhan: ~800 KB (60-120s, 128kbps MP3)
- **Total added: ~1 MB** (acceptable)

**Compression Command**:
```bash
ffmpeg -i original.wav -codec:a libmp3lame -b:a 128k -ar 44100 adhan_short.mp3
```

**If adding multiple adhan styles**: Consider on-demand download later.

---

## Required Decisions Before Implementation

### Decision 1: Audio Strategy
**Options**:
- A) Short sound only (simplest, most reliable)
- B) Short sound + full adhan on tap (recommended)
- C) Try auto-play background (not recommended)

**Recommendation**: **Option B**

### Decision 2: Rescheduling Trigger
**Options**:
- A) After Isha prayer (most accurate)
- B) At midnight (simpler)
- C) On app open only (simplest, less reliable)

**Recommendation**: **A + C combined** (after Isha + fallback on app open)

### Decision 3: Multiple Adhan Styles
**Options**:
- A) Bundle one style only (Makkah)
- B) Bundle 2-3 styles
- C) Bundle one, download others on demand

**Recommendation**: **Option A** for v1, add Option C later

---

## Updated Implementation Priorities

### Must-Do Before Any Coding:
1. ✅ Make audio strategy decision (short + tap-to-play)
2. ✅ Backup native directories before prebuild
3. ✅ Get test devices ready
4. ✅ Acquire/create audio files (<1 MB total)

### Critical Changes to Task 1:
```diff
+ Add SCHEDULE_EXACT_ALARM permission (Android)
+ Add USE_EXACT_ALARM permission (Android 14+)
+ Add NSUserNotificationsUsageDescription (iOS)
+ Add UIBackgroundModes: ["audio"] (iOS)
+ Document prebuild backup procedure
```

### Critical Changes to Task 2:
```diff
- Add single adhan audio file
+ Add TWO audio files:
+   1. Short alert (15-30s, ~300 KB) - for notification
+   2. Full adhan (60-120s, ~800 KB) - for in-app playback
+ Compress both to 128kbps MP3
+ Test quality before committing
```

### Critical Changes to Task 3:
```diff
+ Add requestExactAlarmPermission() function (Android)
+ Add battery optimization guidance functions
+ Document platform-specific permission differences
```

### Critical Changes to Task 6:
```diff
- Schedule notification with full adhan
+ Schedule notification with SHORT alert sound
+ Include data payload: { playFullAdhan: true, prayerName: 'fajr' }
+ Full adhan plays ONLY when user taps notification
```

### Critical Changes to Task 7:
```diff
+ Add notification response listener for full adhan playback
+ Add location change monitoring
+ Add App Store compliance documentation
+ Don't auto-request permissions on first launch
```

### New Task to Add:
**Task 3.5: Exact Alarm Permission Flow (Android)**
- Request permission when user enables notifications
- Show explanation dialog
- Open system settings for approval
- Handle permission denied gracefully
- Add UI to check permission status

---

## Quick Command Reference

### Before Implementation:
```bash
# Backup
git checkout -b feature/adhan-notifications
cp -r android android_backup
cp -r ios ios_backup

# Install
yarn add expo-notifications@~0.28.19

# Prebuild
expo prebuild --clean

# Test
yarn android
yarn ios
```

### Audio Compression:
```bash
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -ar 44100 output.mp3
```

### Testing:
```bash
# Build for devices
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Android debugging
adb shell dumpsys notification
adb shell dumpsys deviceidle force-idle
```

---

## Red Flags to Watch For

🚩 **Stop if you see these**:
- App Store rejection mentioning "background audio" or "unexpected sounds"
- Notifications delayed >5 minutes on Android test devices
- Audio files >2 MB each (re-compress)
- Prebuild breaks Firebase (restore from backup)
- Emulator-only testing (must use real devices)
- Users reporting "adhan doesn't play" (probably background limit)

---

## Success Criteria

✅ **Before release, verify**:
- [ ] Notifications arrive within 30 seconds of prayer time
- [ ] Short alert plays on notification arrival
- [ ] Full adhan plays when user taps notification
- [ ] Works on real Android 13+ device
- [ ] Works on real iOS 15+ device
- [ ] Works with app completely closed
- [ ] Tested with battery saver enabled
- [ ] App Store description mentions user-controlled audio
- [ ] Total audio assets <2 MB
- [ ] Rescheduling works correctly for 3+ days

---

## Summary

**Your project is in good shape**. The main adjustments needed:

1. **Change audio approach**: Short notification sound + full adhan on tap only
2. **Add exact alarm permissions**: Critical for Android
3. **Backup before prebuild**: Protect Firebase config
4. **Physical device testing**: Mandatory, not optional

The feature is **100% achievable** with these adjustments.

**Next Step**: Review the full analysis in [DEVELOPER_CONCERNS_ANALYSIS.md](./DEVELOPER_CONCERNS_ANALYSIS.md) and the [main implementation plan](../implementation/ADHAN_REMINDERS_IMPLEMENTATION.md).
