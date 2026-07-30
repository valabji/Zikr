# Adhan Notifications Implementation Checklist

Use this checklist to track progress and ensure all critical concerns are addressed.

## Pre-Implementation Phase

### Critical Decisions
- [ ] **Audio Strategy Decision**: Confirm using short alert + full adhan on tap
- [ ] **Rescheduling Strategy**: Confirm using after-Isha + app-open fallback
- [ ] **Adhan Styles**: Confirm bundling single style for v1
- [ ] **Test Devices Available**: Minimum 1 Android (13+) and 1 iOS (15+)

### Audio Preparation
- [ ] Acquire short alert audio (15-30s)
- [ ] Acquire full adhan audio (60-120s)
- [ ] Compress short alert to ~300 KB (128kbps MP3)
- [ ] Compress full adhan to ~800 KB (128kbps MP3)
- [ ] Test audio quality on device
- [ ] Verify total audio size <1.5 MB

### Repository Backup
- [ ] Create feature branch: `feature/adhan-notifications`
- [ ] Commit current state
- [ ] Backup android/ directory: `cp -r android android_backup`
- [ ] Backup ios/ directory: `cp -r ios ios_backup`
- [ ] Backup Google Services files
- [ ] Document backup locations

---

## Task 1: Dependencies and Configuration

### Install Dependencies
- [ ] Install expo-notifications: `yarn add expo-notifications@~0.28.19`
- [ ] Verify package.json updated
- [ ] Verify version matches Expo SDK 54

### iOS Configuration (app.config.js)
- [ ] Add `NSUserNotificationsUsageDescription` to infoPlist
- [ ] Add `UIBackgroundModes: ["audio", "remote-notification"]` to infoPlist
- [ ] Verify existing `CFBundleAllowMixedLocalizations` not removed

### Android Configuration (app.config.js)
- [ ] Add `android.permission.POST_NOTIFICATIONS`
- [ ] Add `android.permission.SCHEDULE_EXACT_ALARM`
- [ ] Add `android.permission.USE_EXACT_ALARM`
- [ ] Verify existing permissions not removed

### Prebuild
- [ ] Run `expo prebuild --clean`
- [ ] Verify android/app/google-services.json exists
- [ ] Verify ios/GoogleService-Info.plist exists
- [ ] Test Android build: `yarn android`
- [ ] Test iOS build: `yarn ios`
- [ ] If build fails, restore from backup and debug

### Permission Testing
- [ ] Test notification permission request on Android device
- [ ] Test notification permission request on iOS device
- [ ] Verify permission dialogs appear correctly
- [ ] Test permission granted scenario
- [ ] Test permission denied scenario

**Task 1 Complete**: [ ]

---

## Task 2: Audio Assets

### Add Audio Files
- [ ] Add `assets/sound/adhan_short.mp3` (~300 KB)
- [ ] Add `assets/sound/adhan_full.mp3` (~800 KB)
- [ ] Verify files committed to git
- [ ] Document audio sources/licenses in README

### Test Audio Files
- [ ] Test short alert plays using expo-audio
- [ ] Test full adhan plays using expo-audio
- [ ] Verify audio quality on Android device
- [ ] Verify audio quality on iOS device
- [ ] Test volume control works for both files
- [ ] Verify no audio loading errors

**Task 2 Complete**: [ ]

---

## Task 3: Notification Service

### Create NotificationService.js
- [ ] Create `utils/NotificationService.js`
- [ ] Implement `requestPermissions()` function
- [ ] Implement `checkPermissions()` function
- [ ] Implement `schedulePrayerNotification()` function
- [ ] Implement `cancelPrayerNotification()` function
- [ ] Implement `cancelAllNotifications()` function
- [ ] Add comprehensive error handling
- [ ] Add logging for debugging

### Android Exact Alarm Support
- [ ] Implement `requestExactAlarmPermission()` (Android 12+)
- [ ] Implement `checkExactAlarmPermission()` (Android 12+)
- [ ] Add Intent Launcher integration
- [ ] Test on Android 12+ device

### Platform-Specific Handling
- [ ] Handle iOS permission request flow
- [ ] Handle Android permission request flow
- [ ] Handle permission denied gracefully
- [ ] Test on both platforms

### Unit Tests
- [ ] Create `__tests__/utils/NotificationService.test.js`
- [ ] Test permission request scenarios
- [ ] Test scheduling with various inputs
- [ ] Test cancellation logic
- [ ] Test error handling
- [ ] Verify >80% code coverage

**Task 3 Complete**: [ ]

---

## Task 4: Audio System

### Create AdhanAudio.js
- [ ] Create `utils/AdhanAudio.js` (or extend Sounds.js)
- [ ] Implement `useAdhanAudio()` hook
- [ ] Implement `playShortAlert()` function
- [ ] Implement `playFullAdhan()` function
- [ ] Implement `stopAdhan()` function
- [ ] Separate player instances for alert vs. full adhan

### Volume Control
- [ ] Add `ADHAN_VOLUME` to PrayerConstants STORAGE_KEYS
- [ ] Implement `loadAdhanVolume()` function
- [ ] Implement `setAdhanVolume()` function
- [ ] Default volume: 0.8 (80%)
- [ ] Persist volume to AsyncStorage

### Testing
- [ ] Test short alert playback
- [ ] Test full adhan playback
- [ ] Test volume control
- [ ] Test no conflicts with click sound
- [ ] Verify no memory leaks (React DevTools Profiler)
- [ ] Test on both platforms

### Unit Tests
- [ ] Create `__tests__/utils/AdhanAudio.test.js`
- [ ] Test audio player initialization
- [ ] Test volume control
- [ ] Test playback functions
- [ ] Test AsyncStorage integration

**Task 4 Complete**: [ ]

---

## Task 5: Settings Screen

### Add Storage Keys (PrayerConstants.js)
- [ ] Add `REMINDER_MINUTES_BEFORE`
- [ ] Add `ADHAN_ENABLED`
- [ ] Add `ADHAN_VOLUME`
- [ ] Add `NOTIFICATION_SETTINGS` (single object)
- [ ] Document storage schema

### Update UnifiedPrayerSettingsScreen.js
- [ ] Add state variables for new settings
- [ ] Load settings from AsyncStorage
- [ ] Save settings to AsyncStorage (use single object approach)

### UI Components
- [ ] Add "Notification Settings" section header
- [ ] Add minutes-before picker (0, 5, 10, 15, 30)
- [ ] Add adhan enable/disable toggle
- [ ] Add adhan volume slider with preview
- [ ] Add "Test Adhan" button
- [ ] Ensure RTL support using `useRTL()` hook

### Settings Persistence
- [ ] Implement save function with AsyncStorage
- [ ] Implement load function from AsyncStorage
- [ ] Update `hasChanges` detection logic
- [ ] Test save/discard functionality
- [ ] Verify settings survive app restart

### Localization
- [ ] Add English translations to `locales/en.json`
- [ ] Add Arabic translations to `locales/ar.json`
- [ ] Test all text in both languages
- [ ] Verify RTL layout in Arabic mode

### Testing
- [ ] Test timing picker saves correctly
- [ ] Test adhan toggle persists
- [ ] Test volume slider updates immediately
- [ ] Test settings load on app restart
- [ ] Test RTL layout
- [ ] Update component tests

**Task 5 Complete**: [ ]

---

## Task 6: Notification Scheduling

### Scheduling Logic
- [ ] Create `scheduleAllPrayerNotifications()` in PrayerUtils.js
- [ ] Calculate today's prayer times
- [ ] Calculate tomorrow's prayer times
- [ ] Filter enabled prayers from `notificationTimes` state
- [ ] Apply `minutesBefore` offset
- [ ] Generate unique identifiers for each notification
- [ ] Always cancel all before rescheduling

### Notification Content
- [ ] Use localized prayer names
- [ ] Use localized notification title
- [ ] Use localized notification body
- [ ] Include prayer name in data payload
- [ ] Include `playFullAdhan` flag in data payload
- [ ] Use SHORT alert sound in notification
- [ ] Do NOT auto-play full adhan

### Integration
- [ ] Call scheduling after location selection
- [ ] Call scheduling after settings save
- [ ] Call scheduling on app startup (if location exists)
- [ ] Cancel old notifications before scheduling new ones

### Rescheduling Logic
- [ ] Add `LAST_SCHEDULE_DATE` storage key
- [ ] Detect day change on app open
- [ ] Reschedule after Isha prayer (optional)
- [ ] Reschedule on location change (>30km)
- [ ] Add manual "Reschedule" button in settings

### Error Handling
- [ ] Handle missing location gracefully
- [ ] Handle permission denied scenarios
- [ ] Handle scheduling failures
- [ ] Log all operations for debugging

### Testing
- [ ] Test notification scheduled for correct time
- [ ] Test only enabled prayers scheduled
- [ ] Test minutesBefore offset applied correctly
- [ ] Test notifications rescheduled on day change
- [ ] Test short alert sound plays (not full adhan)
- [ ] Test on both platforms

**Task 6 Complete**: [ ]

---

## Task 7: App Initialization

### App.js Setup
- [ ] Import expo-notifications
- [ ] Set up notification handler (foreground)
- [ ] Set up notification response handler (user tap)
- [ ] Create Android notification channel
- [ ] Initialize in useEffect hook
- [ ] Clean up listeners on unmount

### Android Notification Channel
- [ ] Channel ID: `prayer-times`
- [ ] Channel name: localized
- [ ] Importance: HIGH
- [ ] Sound: `adhan_short.mp3`
- [ ] Vibration pattern configured
- [ ] Test channel creation

### Notification Received Handler (Foreground)
- [ ] Extract notification payload
- [ ] Log notification for debugging
- [ ] Play short alert sound
- [ ] Do NOT auto-play full adhan
- [ ] Test in foreground state

### Notification Response Handler (User Tap)
- [ ] Extract `playFullAdhan` flag from payload
- [ ] Extract `prayerName` from payload
- [ ] Play full adhan if enabled
- [ ] Navigate to Prayer Times screen (optional)
- [ ] Test tap behavior

### Location Monitoring
- [ ] Set up location change listener
- [ ] Detect significant location changes (>30km)
- [ ] Trigger rescheduling on location change
- [ ] Test with simulated location changes

### App State Monitoring
- [ ] Listen for app foreground events
- [ ] Check if rescheduling needed
- [ ] Reschedule if day changed
- [ ] Test after leaving app idle overnight

### Permission Flow
- [ ] Don't auto-request on first launch
- [ ] Request when user enables notifications in settings
- [ ] Show explanation before requesting
- [ ] Handle denied gracefully

### App Store Compliance
- [ ] Document user-initiated audio in App Store notes
- [ ] Verify full adhan only plays on tap
- [ ] Verify clear UI messaging
- [ ] Prepare App Review documentation

### Testing
- [ ] Test notification in foreground
- [ ] Test notification in background
- [ ] Test notification with app closed
- [ ] Test tapping notification plays full adhan
- [ ] Test rescheduling on day change
- [ ] Test on both platforms

**Task 7 Complete**: [ ]

---

## Task 8: Management UI

### Settings Screen Additions
- [ ] Add "Notification Management" section
- [ ] Add permission status indicator
- [ ] Add "Test Adhan Sound" button
- [ ] Add "Send Test Notification" button
- [ ] Add "Scheduled Notifications" list display
- [ ] Add "Cancel All Notifications" button
- [ ] Add "Reschedule Notifications" button

### Permission Status Display
- [ ] Query current permission status
- [ ] Show green checkmark if granted
- [ ] Show red X if denied
- [ ] Add instructions for enabling in system settings
- [ ] Add button to open system settings

### Test Functions
- [ ] "Test Adhan" plays full adhan at current volume
- [ ] "Send Test Notification" schedules test for 5 seconds
- [ ] Test notification includes test message
- [ ] Verify test functions work correctly

### Scheduled Notifications Display
- [ ] Query all scheduled notifications
- [ ] Display prayer name (localized)
- [ ] Display scheduled time (formatted)
- [ ] Display days until notification
- [ ] Show "No notifications scheduled" if empty
- [ ] Auto-refresh on settings change

### Cancel/Reschedule Actions
- [ ] "Cancel All" shows confirmation dialog
- [ ] "Cancel All" clears all scheduled notifications
- [ ] "Cancel All" updates UI
- [ ] "Reschedule" manually triggers rescheduling
- [ ] Show success/error messages

### Exact Alarm Guidance (Android)
- [ ] Add "Battery Optimization" info section
- [ ] Show current exact alarm permission status
- [ ] Add button to request exact alarm permission
- [ ] Add instructions for battery optimization settings
- [ ] Test on Android 12+ devices

### Localization
- [ ] Add all new strings to en.json
- [ ] Add all new strings to ar.json
- [ ] Test in both languages
- [ ] Verify RTL layout

### Testing
- [ ] Test all buttons work correctly
- [ ] Test scheduled notifications display updates
- [ ] Test permission status shows correctly
- [ ] Test on both platforms

**Task 8 Complete**: [ ]

---

## Task 9: Localization and RTL

### English Translations (locales/en.json)
- [ ] Add all notification UI strings
- [ ] Add notification message templates
- [ ] Add error messages
- [ ] Add button labels
- [ ] Add setting descriptions

### Arabic Translations (locales/ar.json)
- [ ] Add all notification UI strings (Arabic)
- [ ] Add notification message templates (Arabic)
- [ ] Add error messages (Arabic)
- [ ] Add button labels (Arabic)
- [ ] Add setting descriptions (Arabic)

### Notification Localization
- [ ] Prayer names localized in notifications
- [ ] Notification titles localized
- [ ] Notification bodies localized
- [ ] Use t() function for all notification text

### RTL Testing
- [ ] Switch app to Arabic mode
- [ ] Test all notification UI elements
- [ ] Verify sliders mirror correctly
- [ ] Verify toggles positioned correctly
- [ ] Verify button alignment
- [ ] Verify scheduled list layout
- [ ] Use existing `useRTL()` hook

### Time/Number Formatting
- [ ] Prayer times formatted per locale
- [ ] Volume percentages formatted correctly
- [ ] Date/time in notifications formatted correctly
- [ ] Test in both languages

### Language Switching
- [ ] Switch between English and Arabic
- [ ] Verify all UI updates immediately
- [ ] Verify notifications reschedule with new language
- [ ] Test multiple times

**Task 9 Complete**: [ ]

---

## Task 10: Testing and QA

### Unit Tests
- [ ] NotificationService tests >80% coverage
- [ ] AdhanAudio tests >80% coverage
- [ ] Settings screen component tests updated
- [ ] All tests pass: `yarn test`

### Integration Tests
- [ ] Create notification flow integration test
- [ ] Test end-to-end scheduling
- [ ] Test rescheduling on location change
- [ ] Test adhan playback trigger

### Physical Device Testing - Android

#### Device Setup
- [ ] Android 13+ device available
- [ ] Device registered with EAS Build
- [ ] Test build installed
- [ ] Logging enabled

#### Permission Testing
- [ ] POST_NOTIFICATIONS permission request works
- [ ] Exact alarm permission request works
- [ ] Permission denied handled gracefully
- [ ] Permission granted works correctly

#### Notification Delivery
- [ ] Notification arrives at correct time (within 30s)
- [ ] Short alert sound plays on arrival
- [ ] Notification appears in foreground
- [ ] Notification appears in background
- [ ] Notification appears with app closed
- [ ] Notification appears with device locked

#### Audio Testing
- [ ] Tapping notification opens app
- [ ] Full adhan plays when tapped
- [ ] Volume control works
- [ ] No conflicts with other apps' audio
- [ ] Bluetooth headphones work

#### Battery Optimization
- [ ] Test with battery saver enabled
- [ ] Test with aggressive battery optimization (Samsung/Xiaomi)
- [ ] Test after device idle 30+ minutes (Doze mode)
- [ ] Notifications still arrive on time

### Physical Device Testing - iOS

#### Device Setup
- [ ] iOS 15+ device available
- [ ] Device registered with EAS Build
- [ ] Test build installed
- [ ] Logging enabled

#### Permission Testing
- [ ] Notification permission request works
- [ ] Permission denied handled gracefully
- [ ] Permission granted works correctly

#### Notification Delivery
- [ ] Notification arrives at correct time (within 30s)
- [ ] Short alert sound plays on arrival
- [ ] Notification appears in foreground
- [ ] Notification appears in background
- [ ] Notification appears with app closed
- [ ] Notification appears with device locked

#### Audio Testing
- [ ] Tapping notification opens app
- [ ] Full adhan plays when tapped
- [ ] Volume control works
- [ ] No conflicts with other apps' audio
- [ ] AirPods work correctly

#### Low Power Mode
- [ ] Test with Low Power Mode enabled
- [ ] Notifications still arrive on time

### Cross-Platform Testing

#### Localization
- [ ] Test in English mode
- [ ] Test in Arabic mode
- [ ] Switch language multiple times
- [ ] Verify RTL layout

#### Edge Cases
- [ ] No location set
- [ ] Location changed during scheduled notifications
- [ ] Day change triggers rescheduling
- [ ] Timezone change detected
- [ ] App updated (notifications persist)
- [ ] Storage cleared (graceful degradation)
- [ ] Permissions revoked and re-granted
- [ ] Airplane mode (notifications still schedule)
- [ ] Do Not Disturb mode
- [ ] Device time manually changed

#### Multi-Day Testing
- [ ] Install and configure app
- [ ] Verify notifications work for Day 1
- [ ] Verify notifications work for Day 2
- [ ] Verify notifications work for Day 3
- [ ] Confirm automatic rescheduling works

### Performance Testing
- [ ] Monitor memory usage during audio playback
- [ ] Check for memory leaks (React DevTools)
- [ ] Monitor battery drain over 24 hours (<5% increase)
- [ ] Profile app startup time (<200ms increase)
- [ ] Check notification scheduling performance (<500ms)

### Regression Testing
- [ ] Existing features still work
- [ ] Prayer time calculation unaffected
- [ ] Qibla compass unaffected
- [ ] Click sounds still work
- [ ] Settings save/load correctly
- [ ] Navigation works correctly

**Task 10 Complete**: [ ]

---

## Pre-Release Checklist

### Documentation
- [ ] Update README.md with notification feature
- [ ] Document audio sources and licenses
- [ ] Create user guide for notifications
- [ ] Document known limitations
- [ ] Create troubleshooting guide

### App Store Preparation

#### iOS App Store
- [ ] Update app description mentioning notifications
- [ ] Add screenshots showing notification feature
- [ ] Prepare App Review notes about audio
- [ ] Document user-controlled audio playback
- [ ] Submit for review

#### Google Play Store
- [ ] Update app description mentioning notifications
- [ ] Add screenshots showing notification feature
- [ ] Update permissions explanation
- [ ] Document exact alarm usage
- [ ] Submit for review

### Final Verification
- [ ] All tasks marked complete
- [ ] All tests passing
- [ ] No critical/high bugs
- [ ] Tested on minimum 2 devices per platform
- [ ] Battery drain acceptable (<5% increase)
- [ ] App size increase acceptable (<2 MB)
- [ ] Documentation complete
- [ ] Ready for release

---

## Success Metrics (Post-Release)

Monitor these after release:

- [ ] Notification delivery reliability >95%
- [ ] No App Store rejections related to audio
- [ ] User ratings maintained or improved
- [ ] Battery drain complaints <1% of users
- [ ] Crash rate not increased
- [ ] Feature adoption rate >50% (users enabling notifications)

---

## Rollback Plan

If critical issues found after release:

1. [ ] Identify issue severity
2. [ ] If critical, disable notifications server-side (if possible)
3. [ ] Prepare hotfix version
4. [ ] Test hotfix on devices
5. [ ] Submit emergency update to stores
6. [ ] Communicate with users via app description

---

## Notes Section

Use this space to track issues, decisions, and important notes during implementation:

### Issues Encountered:
```
(Document any problems and solutions here)
```

### Decisions Made:
```
(Document any architectural decisions here)
```

### Todo/Follow-up:
```
(Document any items to address in future versions)
```

---

## Sign-Off

- [ ] **Project Lead Approval**: ___________________ Date: ___________
- [ ] **QA Lead Approval**: ___________________ Date: ___________
- [ ] **Ready for Release**: ___________________ Date: ___________

---

**Total Progress**: ____ / 10 Tasks Complete

**Estimated Completion**: ___________

**Actual Completion**: ___________
