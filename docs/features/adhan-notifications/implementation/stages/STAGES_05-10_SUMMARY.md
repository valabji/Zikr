# Stages 5-10: Quick Reference Summary

**Purpose**: This document provides a condensed overview of stages 5-10 for quick reference. For full implementation details, refer to individual stage files when they are created.

---

## Stage 5: Settings Screen UI (3 hours)

### Objective
Add notification controls and system status indicators to SettingsScreen.

### Key Tasks
1. Add exact alarm status banner (Android 12+)
2. Add battery optimization warning banner
3. Add notification enable/disable toggle
4. Add audio mode selection (none/short/full)
5. Add prayer selection checkboxes (Fajr, Dhuhr, Asr, Maghrib, Isha)
6. Persist settings to AsyncStorage
7. Open system settings buttons

### Files to Modify
- `screens/SettingsScreen.js` or `screens/UnifiedPrayerSettingsScreen.js`

### Critical Components
```javascript
// Android status check
const [hasExactAlarm, setHasExactAlarm] = useState(false);
const [hasBatteryOptimization, setHasBatteryOptimization] = useState(false);

// Notification settings
const [notificationsEnabled, setNotificationsEnabled] = useState(true);
const [audioMode, setAudioMode] = useState('short'); // 'none', 'short', 'full'
const [enabledPrayers, setEnabledPrayers] = useState({
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
});
```

### Storage Keys
- `notifications_enabled` - boolean
- `audio_mode` - 'none' | 'short' | 'full'
- `enabled_prayers` - JSON object

### Acceptance Criteria
- Settings screen shows Android system status
- All toggles save to AsyncStorage
- Can open exact alarm settings
- Can open battery optimization settings
- UI is responsive and intuitive

---

## Stage 6: Scheduling Logic (3 hours)

### Objective
Create PrayerScheduler utility to schedule daily prayer notifications.

### Key Tasks
1. Create `utils/PrayerScheduler.js`
2. Implement cancel-first approach (prevent duplicates)
3. Schedule all 5 prayers based on user settings
4. Implement day change detection
5. Handle timezone changes
6. Calculate prayer times using existing Adhan library

### Core Algorithm
```javascript
async function schedulePrayerNotifications() {
  // 1. Cancel ALL existing notifications
  await NotificationService.cancelAllNotifications();
  
  // 2. Get user settings
  const settings = await getNotificationSettings();
  
  if (!settings.enabled) {
    return; // Don't schedule if disabled
  }
  
  // 3. Calculate today's prayer times
  const prayerTimes = calculatePrayerTimes(); // Using Adhan library
  
  // 4. Schedule enabled prayers
  for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    if (settings.enabledPrayers[prayer]) {
      const time = prayerTimes[prayer];
      await NotificationService.scheduleExactNotification(
        prayer,
        `Time for ${prayer}`,
        `It's time for ${prayer} prayer`,
        time,
        settings.audioMode
      );
    }
  }
  
  // 5. Schedule next day's notifications at midnight
  await scheduleNextDayRefresh();
}
```

### Day Change Detection
```javascript
// Store last scheduled date
await AsyncStorage.setItem('last_scheduled_date', today);

// Check on app open
const lastDate = await AsyncStorage.getItem('last_scheduled_date');
if (lastDate !== today) {
  await schedulePrayerNotifications(); // Reschedule
}
```

### Acceptance Criteria
- Cancel-first prevents duplicates
- All 5 prayers schedule correctly
- Day change triggers reschedule
- Respects user's enabled/disabled prayers
- Respects audio mode setting

---

## Stage 7: App Initialization (2 hours)

### Objective
Initialize notification system when app starts and handle day changes.

### Key Tasks
1. Update App.js with notification response handler
2. Add day change detector to MainScreen.js
3. Schedule notifications on first app launch
4. Reschedule on day change
5. Handle app background/foreground transitions

### App.js Updates
```javascript
// In App.js useEffect
useEffect(() => {
  // Initialize audio
  Sounds.initialize();
  
  // Handle notification responses
  const subscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const { soundType } = response.notification.request.content.data;
      await Sounds.playNotificationSound(soundType, true);
    }
  );
  
  // Initial scheduling
  checkAndScheduleNotifications();
  
  return () => subscription.remove();
}, []);
```

### MainScreen.js Updates
```javascript
// Add day change detector
useEffect(() => {
  const interval = setInterval(async () => {
    const today = new Date().toDateString();
    const lastDate = await AsyncStorage.getItem('last_scheduled_date');
    
    if (lastDate !== today) {
      console.log('Day changed, rescheduling notifications');
      await PrayerScheduler.schedulePrayerNotifications();
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(interval);
}, []);
```

### Acceptance Criteria
- Notifications schedule on app first launch
- Day change detection works
- Notification tap plays correct audio
- App handles background/foreground correctly

---

## Stage 8: Management UI (2 hours)

### Objective
Create UI to show scheduled notifications and system status.

### Key Tasks
1. Update PrayerTimesScreen.js (or create new screen)
2. Show next 5 scheduled notifications
3. Show exact alarm status banner (Android)
4. Show battery optimization banner (Android)
5. Add manual reschedule button
6. Add debug info (dev mode)

### UI Components
```javascript
// Notification list
<FlatList
  data={scheduledNotifications}
  renderItem={({ item }) => (
    <View>
      <Text>{item.prayer}: {formatTime(item.time)}</Text>
      <Text>{item.timeRemaining} remaining</Text>
    </View>
  )}
/>

// Status banners
{!hasExactAlarm && Platform.OS === 'android' && (
  <Banner type="warning">
    Exact alarms not enabled. Notifications may be delayed.
    <Button onPress={openExactAlarmSettings}>Enable</Button>
  </Banner>
)}

{hasBatteryOptimization && (
  <Banner type="warning">
    Battery optimization may delay notifications.
    <Button onPress={openBatterySettings}>Fix</Button>
  </Banner>
)}
```

### Acceptance Criteria
- Shows all scheduled notifications
- Time remaining updates live
- Banners show correct system status
- Manual reschedule button works
- Debug info helpful for troubleshooting

---

## Stage 9: Localization (2 hours)

### Objective
Add English and Arabic translations for all notification-related strings.

### Key Tasks
1. Update `locales/en.json` with 20+ new keys
2. Update `locales/ar.json` with Arabic translations
3. Localize notification titles and bodies
4. Localize settings screen labels
5. Localize error messages
6. Test RTL layout (Arabic)

### Translation Keys Needed

**Notification Keys**:
```json
{
  "notifications.fajr.title": "Time for Fajr",
  "notifications.fajr.body": "It's time for Fajr prayer",
  "notifications.dhuhr.title": "Time for Dhuhr",
  "notifications.dhuhr.body": "It's time for Dhuhr prayer",
  // ... repeat for all 5 prayers
}
```

**Settings Keys**:
```json
{
  "settings.notifications.title": "Prayer Notifications",
  "settings.notifications.enabled": "Enable Notifications",
  "settings.notifications.audioMode": "Audio Mode",
  "settings.notifications.audioMode.none": "Silent",
  "settings.notifications.audioMode.short": "Short Alert",
  "settings.notifications.audioMode.full": "Full Adhan",
  "settings.notifications.selectPrayers": "Select Prayers",
  "settings.notifications.exactAlarm.title": "Exact Alarms Required",
  "settings.notifications.exactAlarm.message": "Enable exact alarms for precise timing",
  "settings.notifications.battery.title": "Battery Optimization",
  "settings.notifications.battery.message": "Disable battery optimization for reliable notifications"
}
```

**Error Messages**:
```json
{
  "notifications.error.permission": "Notification permission denied",
  "notifications.error.scheduling": "Failed to schedule notification",
  "notifications.error.audio": "Failed to play audio"
}
```

### Arabic Translations
- Ensure RTL layout works correctly
- Use proper Arabic prayer names (صلاة الفجر, etc.)
- Test that notification text displays correctly
- Verify settings screen RTL alignment

### Acceptance Criteria
- All English strings added
- All Arabic translations added
- RTL layout correct
- Notifications show in user's language
- No hardcoded strings remaining

---

## Stage 10: Testing and Validation (3-4 hours)

### Objective
Comprehensive testing on physical devices to ensure production readiness.

### Testing Checklist

#### Basic Functionality ✅
- [ ] All 5 prayers schedule correctly
- [ ] Notification appears at exact time (<2 sec precision)
- [ ] Short alert plays automatically
- [ ] Full adhan plays on tap
- [ ] Stop full adhan works
- [ ] Settings persist across app restarts

#### Android Specific ✅
- [ ] Exact alarm permission request works
- [ ] Exact alarms fire precisely
- [ ] Battery optimization detection works
- [ ] Can open exact alarm settings
- [ ] Can open battery optimization settings
- [ ] Notifications work with battery saver ON
- [ ] Notifications work in Do Not Disturb mode

#### iOS Specific ✅
- [ ] Notification permission request works
- [ ] Audio plays in silent mode
- [ ] Background audio works
- [ ] Notifications show correctly

#### Multi-Day Testing ✅
- [ ] **Day 1**: Schedule all prayers, verify they fire
- [ ] **Day 2**: Check notifications rescheduled at midnight
- [ ] **Day 3**: Verify continued correct behavior
- [ ] Test with app in background
- [ ] Test with app force-closed
- [ ] Test with device restarted

#### Edge Cases ✅
- [ ] Timezone change (travel simulation)
- [ ] Date change at midnight
- [ ] App reinstall (settings cleared)
- [ ] Disable/re-enable notifications
- [ ] Change audio mode while playing
- [ ] Multiple notification taps
- [ ] Phone call during adhan playback
- [ ] Low battery mode

#### Localization ✅
- [ ] Switch to Arabic, verify translations
- [ ] Verify RTL layout correct
- [ ] Verify Arabic notifications display correctly
- [ ] Switch back to English, verify

### Test Report Template
```
# Adhan Notifications Test Report

## Device Information
- Device: [Device model]
- Android Version: [Version]
- App Version: [Version]

## Test Results
| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Fajr notification at 5:30 AM | Fires at 5:30 AM ±2 sec | Fired at 5:30:01 AM | ✅ PASS |
| Short alert auto-play | Plays automatically | Played automatically | ✅ PASS |
| Full adhan on tap | Plays when tapped | Played when tapped | ✅ PASS |
| ... | ... | ... | ... |

## Issues Found
1. [Issue description]
   - Severity: [Low/Medium/High]
   - Status: [Open/Fixed]

## Conclusion
[Overall assessment of feature readiness]
```

### Acceptance Criteria
- All basic functionality tests pass
- All platform-specific tests pass
- Multi-day testing successful (at least 3 days)
- All edge cases handled gracefully
- Localization correct
- No critical bugs
- Performance acceptable
- Production-ready

---

## 🎉 Implementation Complete!

After completing all 10 stages, you will have:

✅ **Fully functional adhan notification system**  
✅ **Android exact alarm support** (<2 sec precision)  
✅ **Two audio modes** (short alert + full adhan)  
✅ **User-friendly settings** with system status indicators  
✅ **Battery optimization guidance** for Android  
✅ **Daily auto-rescheduling** with day change detection  
✅ **English + Arabic** localization  
✅ **Comprehensive testing** completed  
✅ **Production-ready** feature

---

## Next Steps After Implementation

1. **User Beta Testing** - Get feedback from real users
2. **Performance Monitoring** - Track notification reliability
3. **User Feedback** - Collect data on audio preferences
4. **Iteration** - Improve based on user feedback

---

**Questions?** Refer to:
- Main doc: `../ADHAN_REMINDERS_IMPLEMENTATION.md`
- Quick start: `../guides/QUICK_START_IMPLEMENTATION.md`
- Concerns: `../analysis/DEVELOPER_CONCERNS_ANALYSIS.md`
