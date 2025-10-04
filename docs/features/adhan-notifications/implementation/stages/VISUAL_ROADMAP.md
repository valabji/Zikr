# Implementation Stages: Visual Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ADHAN NOTIFICATIONS IMPLEMENTATION ROADMAP                   │
│                        Total: 10 Stages | 20-25 Hours                       │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                         PHASE 1: FOUNDATION (6 hours)                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: Dependencies & Configuration                     [1 hour] ⚠️   │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Install expo-notifications@~0.28.19                                   │
│ ✓ Install expo-intent-launcher                                          │
│ ✓ Configure Android permissions (SCHEDULE_EXACT_ALARM - CRITICAL!)      │
│ ✓ Configure iOS permissions (NSUserNotificationsUsageDescription)       │
│ ✓ Run expo prebuild (with Firebase backup!)                             │
│                                                                           │
│ Files Modified: package.json, app.config.js, android/, ios/              │
│ Critical: ⚠️  Must backup Firebase configs before prebuild               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: Audio Assets Preparation                         [2 hours] 🎵  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Source/create short alert audio (3-5 sec)                             │
│ ✓ Source/create full adhan audio (2-3 min)                              │
│ ✓ Compress short alert to <100KB                                        │
│ ✓ Compress full adhan to <2MB                                           │
│ ✓ Add to assets/sound/ folder                                           │
│                                                                           │
│ Files Created: assets/sound/adhan_short_alert.mp3 (~75KB)               │
│               assets/sound/adhan_full.mp3 (~1.5MB)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: Notification Service Core                        [3 hours] 🔔  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Create NotificationService.js (~450 lines)                            │
│ ✓ Implement requestPermissions() (iOS + Android)                        │
│ ✓ Implement scheduleExactNotification() (exact alarms!)                 │
│ ✓ Implement checkExactAlarmPermission() (Android 12+)                   │
│ ✓ Implement openExactAlarmSettings() (guide users)                      │
│ ✓ Implement battery optimization detection                              │
│ ✓ Test on physical Android device                                       │
│                                                                           │
│ Files Created: utils/NotificationService.js (NEW)                        │
│ Critical: ⚠️  MUST test exact alarms on physical device                 │
│           Without exact alarms, notifications delayed 15-30 minutes!     │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                      PHASE 2: INTEGRATION (4 hours)                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: Audio System Integration                         [2 hours] 🔊  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Update Sounds.js with TWO audio players                               │
│ ✓ Implement playShortAlert() (auto-play on notification)                │
│ ✓ Implement playFullAdhan() (play on notification tap)                  │
│ ✓ Implement stopFullAdhan() (user control)                              │
│ ✓ Add notification listeners to NotificationService                     │
│ ✓ Initialize audio in App.js                                            │
│                                                                           │
│ Files Modified: utils/Sounds.js (UPDATED)                                │
│                utils/NotificationService.js (UPDATED)                    │
│                App.js (UPDATED)                                          │
│ Why two players? Prevents conflicts when tapping notification while     │
│ short alert is playing                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: Settings Screen UI                               [2 hours] ⚙️   │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Add exact alarm status banner (Android)                               │
│ ✓ Add battery optimization warning                                      │
│ ✓ Add notification enable/disable toggle                                │
│ ✓ Add audio mode selector (none/short/full)                             │
│ ✓ Add prayer checkboxes (Fajr, Dhuhr, Asr, Maghrib, Isha)               │
│ ✓ Persist settings to AsyncStorage                                      │
│ ✓ Add "Open Settings" buttons                                           │
│                                                                           │
│ Files Modified: screens/SettingsScreen.js (UPDATED)                      │
│                or screens/UnifiedPrayerSettingsScreen.js                 │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                      PHASE 3: CORE LOGIC (5 hours)                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: Scheduling Logic                                 [3 hours] 📅  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Create PrayerScheduler.js                                             │
│ ✓ Implement cancel-first approach (prevent duplicates!)                 │
│ ✓ Schedule all 5 prayers based on user settings                         │
│ ✓ Implement day change detection (reschedule daily)                     │
│ ✓ Handle timezone changes                                               │
│ ✓ Integrate with existing Adhan library                                 │
│                                                                           │
│ Files Created: utils/PrayerScheduler.js (NEW)                            │
│ Algorithm: 1. Cancel ALL → 2. Get settings → 3. Calculate times →       │
│           4. Schedule enabled prayers → 5. Schedule next day refresh    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: App Initialization                               [2 hours] 🚀  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Add notification response handler to App.js                           │
│ ✓ Add day change detector to MainScreen.js                              │
│ ✓ Schedule on first app launch                                          │
│ ✓ Reschedule on day change                                              │
│ ✓ Handle background/foreground transitions                              │
│                                                                           │
│ Files Modified: App.js (UPDATED)                                         │
│                screens/MainScreen.js (UPDATED)                           │
│ Day change check runs every minute to detect date change                │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                    PHASE 4: POLISH & TESTING (6-7 hours)                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 8: Management UI                                    [2 hours] 📊  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Update PrayerTimesScreen.js                                           │
│ ✓ Show next 5 scheduled notifications                                   │
│ ✓ Show exact alarm status banner                                        │
│ ✓ Show battery optimization banner                                      │
│ ✓ Add manual reschedule button                                          │
│ ✓ Add debug info (dev mode)                                             │
│                                                                           │
│ Files Modified: screens/PrayerTimesScreen.js (UPDATED)                   │
│ Shows live countdown to next notification                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 9: Localization                                     [2 hours] 🌐  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Add 20+ keys to locales/en.json                                       │
│ ✓ Add Arabic translations to locales/ar.json                            │
│ ✓ Localize notification titles and bodies                               │
│ ✓ Localize settings screen labels                                       │
│ ✓ Localize error messages                                               │
│ ✓ Test RTL layout (Arabic)                                              │
│                                                                           │
│ Files Modified: locales/en.json (UPDATED)                                │
│                locales/ar.json (UPDATED)                                 │
│ Uses i18n for all user-facing text                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 10: Testing & Validation                         [3-4 hours] ✅  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Test all 5 prayers schedule correctly                                 │
│ ✓ Verify exact timing (<2 sec precision)                                │
│ ✓ Test short alert auto-play                                            │
│ ✓ Test full adhan on tap                                                │
│ ✓ Test stop functionality                                               │
│ ✓ Multi-day testing (3+ days)                                           │
│ ✓ Test battery optimization impact                                      │
│ ✓ Test edge cases (timezone, restart, etc.)                             │
│ ✓ Test localization (EN + AR)                                           │
│ ✓ Complete test report                                                  │
│                                                                           │
│ Required: Physical Android 12+ device                                   │
│ Duration: Minimum 3 consecutive days of testing                         │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                              🎉 COMPLETE! 🎉                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                          FINAL DELIVERABLES                              │
├─────────────────────────────────────────────────────────────────────────┤
│ ✅ Full adhan notification system                                        │
│ ✅ Android exact alarm support (<2 sec precision)                        │
│ ✅ Two audio modes (short alert + full adhan)                            │
│ ✅ User-friendly settings with system status                             │
│ ✅ Battery optimization guidance                                         │
│ ✅ Daily auto-rescheduling                                               │
│ ✅ English + Arabic localization                                         │
│ ✅ Comprehensive testing completed                                       │
│ ✅ Production-ready feature                                              │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

                          KEY SUCCESS METRICS

┌────────────────────────┬─────────────────────────────────────────────┐
│ Metric                 │ Target                                      │
├────────────────────────┼─────────────────────────────────────────────┤
│ Notification Precision │ <2 seconds from scheduled time              │
│ Audio Playback         │ 100% success rate                           │
│ Battery Impact         │ <5% per day                                 │
│ User Satisfaction      │ >90% find it useful                         │
│ Crash Rate             │ <0.1%                                       │
└────────────────────────┴─────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════

                         IMPLEMENTATION TIPS

⚠️  CRITICAL:
- Always backup Firebase configs before prebuild
- Test exact alarms on physical Android 12+ device
- Implement cancel-first to prevent duplicates
- Guide users to disable battery optimization

💡 BEST PRACTICES:
- Commit after each stage completion
- Test thoroughly before moving to next stage
- Read troubleshooting sections when stuck
- Follow stages sequentially, don't skip

🚀 OPTIMIZATION:
- Stages 1-2 can run in parallel (by different people)
- Stages 3-4 must be sequential
- Testing (Stage 10) takes minimum 3 days
- Plan for 5-day implementation timeline

═══════════════════════════════════════════════════════════════════════════

START HERE: Open STAGE_01_DEPENDENCIES.md
```
