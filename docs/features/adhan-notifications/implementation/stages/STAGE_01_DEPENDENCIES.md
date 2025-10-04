# Stage 1: Dependencies and Configuration Setup

**Stage**: 1 of 10  
**Estimated Time**: 1 hour  
**Complexity**: Easy  
**Prerequisites**: None - This is the first stage

---

## 🎯 Objective

Set up all required dependencies, permissions, and configuration for the adhan notifications feature. This includes installing npm packages, configuring iOS/Android permissions, and safely running prebuild.

---

## 📋 Tasks Checklist

- [ ] Backup native directories and Firebase config
- [ ] Install expo-notifications package
- [ ] Install expo-intent-launcher package
- [ ] Configure Android permissions in app.config.js
- [ ] Configure iOS permissions in app.config.js
- [ ] Run expo prebuild safely
- [ ] Verify Firebase configuration intact
- [ ] Verify app builds successfully

---

## 🚨 CRITICAL: Backup Before Starting

**MUST DO FIRST** - These steps prevent breaking your Firebase configuration:

```bash
# Navigate to project root
cd Zikr

# Backup native directories
cp -r android android_backup

# Backup Firebase config files
cp google-services.json google-services.json.backup
cp GoogleService-Info.plist GoogleService-Info.plist.backup

# Commit current state to git
git add .
git commit -m "Backup before adhan notifications stage 1"
```

**Why this matters**: `expo prebuild --clean` can delete custom Firebase configuration files. Always backup first.

---

## 📦 Step 1: Install Dependencies

### Install expo-notifications

**Current Status**: Not installed (check `package.json` - you won't find it listed)

**Version Required**: ~0.28.19 (compatible with Expo SDK 54)

```bash
npx expo install expo-notifications@~0.28.19
```

**Expected Output**:
```
✔ Installed expo-notifications@0.28.19
```

### Install expo-intent-launcher

**Purpose**: Required for Android - opens system settings for exact alarms and battery optimization

```bash
npx expo install expo-intent-launcher
```

**Expected Output**:
```
✔ Installed expo-intent-launcher
```

### Verify Installation

Check `package.json` now includes:
```json
{
  "dependencies": {
    "expo-notifications": "~0.28.19",
    "expo-intent-launcher": "~11.8.2"
  }
}
```

**File Location**: `package.json` (project root)

---

## ⚙️ Step 2: Configure Android Permissions

### File to Edit

**Location**: `app.config.js` (project root)

### Current State

The file already has location permissions. You'll be adding notification-related permissions.

### What to Add

Find the `android` section in `app.config.js` and locate the `permissions` array. Add these permissions:

```javascript
android: {
  // ... existing config
  permissions: [
    // ... existing permissions (keep all of these)
    "POST_NOTIFICATIONS",              // NEW - Required for Android 13+
    "SCHEDULE_EXACT_ALARM",            // NEW - Critical for precise timing
    "USE_EXACT_ALARM",                 // NEW - Required for Android 14+
    "VIBRATE",                         // NEW - Notification vibration
    "RECEIVE_BOOT_COMPLETED"           // NEW - Reschedule after device reboot
  ],
  // ... rest of config
}
```

**Context**: These permissions ensure:
- `POST_NOTIFICATIONS` - Show notifications on Android 13+
- `SCHEDULE_EXACT_ALARM` - Schedule notifications at exact prayer times (without this, notifications delayed 15-30 minutes!)
- `USE_EXACT_ALARM` - Android 14+ requirement for exact timing
- `VIBRATE` - Allow notification vibration
- `RECEIVE_BOOT_COMPLETED` - Reschedule notifications after device restart

### Complete Example

```javascript
export default {
  // ... other config
  android: {
    package: "com.yourcompany.zikr",
    versionCode: 1,
    adaptiveIcon: {
      // ... existing
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",        // Existing
      "ACCESS_FINE_LOCATION",          // Existing
      "POST_NOTIFICATIONS",            // NEW
      "SCHEDULE_EXACT_ALARM",          // NEW - CRITICAL
      "USE_EXACT_ALARM",               // NEW - CRITICAL
      "VIBRATE",                       // NEW
      "RECEIVE_BOOT_COMPLETED"         // NEW
    ]
  },
  // ... rest of config
}
```

---

## 🍎 Step 3: Configure iOS Permissions

### File to Edit

**Location**: `app.config.js` (project root)

### Current State

The file has `infoPlist` section for location permissions. You'll add notification permission strings.

### What to Add

Find the `ios` section and locate the `infoPlist` object. Add these keys:

```javascript
ios: {
  // ... existing config
  infoPlist: {
    // ... existing keys (keep all of these)
    NSUserNotificationsUsageDescription: "Zikr needs notification permission to remind you of prayer times. You can customize which prayers to be notified about in the app settings.",
    UIBackgroundModes: ["audio"],  // Required for playing adhan audio
    // ... rest of infoPlist
  },
  // ... rest of config
}
```

**Context**: 
- `NSUserNotificationsUsageDescription` - Shown to user when requesting notification permission (REQUIRED by Apple)
- `UIBackgroundModes: ["audio"]` - Allows audio playback from notifications

### Complete Example

```javascript
export default {
  // ... other config
  ios: {
    bundleIdentifier: "com.yourcompany.zikr",
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "Zikr needs your location to calculate accurate prayer times based on your geographic coordinates.",  // Existing
      NSLocationAlwaysUsageDescription: "Zikr needs your location to calculate accurate prayer times.",  // Existing
      NSUserNotificationsUsageDescription: "Zikr needs notification permission to remind you of prayer times. You can customize which prayers to be notified about in the app settings.",  // NEW - CRITICAL
      UIBackgroundModes: ["audio"]  // NEW
    }
  },
  // ... rest of config
}
```

---

## 🔨 Step 4: Run Expo Prebuild

### Why Prebuild is Needed

The new permissions need to be added to native Android and iOS projects. Prebuild generates/updates these native files.

### Command to Run

```bash
npx expo prebuild --clean
```

**What this does**:
1. Removes existing `android/` and `ios/` folders
2. Regenerates them with updated permissions
3. Applies all config from `app.config.js`

### Expected Output

```
✔ Cleaned native directories
✔ Created native directories from template
✔ Updated native configuration
✔ iOS project configured
✔ Android project configured
```

### ⚠️ CRITICAL: Verify Firebase Files

**IMMEDIATELY after prebuild**, check that Firebase files still exist:

```bash
# Check files exist
ls google-services.json
ls GoogleService-Info.plist

# If missing, restore from backup:
cp google-services.json.backup google-services.json
cp GoogleService-Info.plist.backup GoogleService-Info.plist
```

**Also verify they're in android/ folder**:

```bash
ls android/app/google-services.json
```

If missing:
```bash
cp google-services.json android/app/google-services.json
```

---

## ✅ Step 5: Verify Build Success

### Build Android

```bash
npx expo run:android
```

**Expected**: App builds and installs on connected Android device/emulator

**If build fails**:
1. Check Firebase file: `android/app/google-services.json` exists
2. Check permissions in `android/app/src/main/AndroidManifest.xml`
3. Try: `cd android && ./gradlew clean && cd ..`

### Build iOS (if on Mac)

```bash
npx expo run:ios
```

**Expected**: App builds and installs on connected iOS device/simulator

**If build fails**:
1. Check Firebase file: `ios/GoogleService-Info.plist` exists
2. Check info.plist has NSUserNotificationsUsageDescription
3. Try: `cd ios && pod install && cd ..`

---

## 📁 Project Structure After This Stage

```
Zikr/
├── package.json                        # ✅ Updated with new dependencies
├── app.config.js                       # ✅ Updated with permissions
├── google-services.json                # ✅ Verified intact
├── google-services.json.backup         # ✅ Created (backup)
├── GoogleService-Info.plist           # ✅ Verified intact
├── GoogleService-Info.plist.backup    # ✅ Created (backup)
├── android/                            # ✅ Regenerated with permissions
│   └── app/
│       ├── src/main/AndroidManifest.xml  # ✅ Has new permissions
│       └── google-services.json          # ✅ Verified
├── android_backup/                     # ✅ Created (backup)
└── ios/                                # ✅ Regenerated with permissions
    └── Zikr/
        ├── Info.plist                  # ✅ Has NSUserNotificationsUsageDescription
        └── GoogleService-Info.plist    # ✅ Verified
```

---

## ✅ Acceptance Criteria

Before moving to Stage 2, verify:

- [ ] `expo-notifications@~0.28.19` installed in package.json
- [ ] `expo-intent-launcher` installed in package.json
- [ ] Android permissions added to app.config.js (5 new permissions)
- [ ] iOS infoPlist updated with NSUserNotificationsUsageDescription
- [ ] iOS UIBackgroundModes includes "audio"
- [ ] Prebuild completed without errors
- [ ] google-services.json intact and in android/app/
- [ ] GoogleService-Info.plist intact
- [ ] App builds successfully on Android
- [ ] App builds successfully on iOS (if applicable)
- [ ] Backups created and committed to git

---

## 🐛 Common Issues and Solutions

### Issue 1: Prebuild Deletes Firebase Files

**Symptoms**: App won't build, Firebase error messages

**Solution**:
```bash
cp google-services.json.backup google-services.json
cp google-services.json android/app/google-services.json
cp GoogleService-Info.plist.backup GoogleService-Info.plist
```

### Issue 2: Android Build Fails with "Duplicate Permissions"

**Symptoms**: Build error mentioning duplicate permissions

**Solution**: Check `android/app/src/main/AndroidManifest.xml` - permissions might be duplicated. Remove duplicates, keep one of each.

### Issue 3: iOS Build Fails with "Missing Permission Description"

**Symptoms**: Build error or App Store rejection

**Solution**: Verify `ios/Zikr/Info.plist` contains `NSUserNotificationsUsageDescription` key

### Issue 4: expo-notifications Version Conflict

**Symptoms**: Installation error about incompatible versions

**Solution**: Use exact version for SDK 54:
```bash
npx expo install expo-notifications@0.28.19 --fix
```

---

## 📝 Verification Commands

Run these to verify Stage 1 completion:

```bash
# Verify dependencies installed
grep "expo-notifications" package.json
grep "expo-intent-launcher" package.json

# Verify Android permissions
grep "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml
grep "POST_NOTIFICATIONS" android/app/src/main/AndroidManifest.xml

# Verify iOS permission description
grep "NSUserNotificationsUsageDescription" ios/Zikr/Info.plist

# Verify Firebase files
ls -la google-services.json android/app/google-services.json GoogleService-Info.plist
```

**All commands should return results** - if any fail, that step needs attention.

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# Stop any running builds
# Ctrl+C in terminals

# Restore from backup
rm -rf android ios
cp -r android_backup android

# Restore Firebase files
cp google-services.json.backup google-services.json
cp GoogleService-Info.plist.backup GoogleService-Info.plist

# Restore package.json from git
git checkout package.json app.config.js

# Reinstall dependencies
npm install
```

---

## 📤 Git Commit

Once Stage 1 is complete and verified:

```bash
git add .
git commit -m "feat: stage 1 - add notifications dependencies and permissions

- Install expo-notifications@~0.28.19
- Install expo-intent-launcher
- Add Android exact alarm permissions (CRITICAL for timing)
- Add iOS notification permission descriptions
- Run expo prebuild with Firebase backup
- Verify all builds successful

Stage 1 of 10 complete"
```

---

## ➡️ Next Stage

**Stage 2**: Audio Assets Preparation
- Create two audio files (short alert + full adhan)
- Compress to required sizes
- Add to assets/sound/ folder

**Location**: `stages/STAGE_02_AUDIO_ASSETS.md`

---

**Stage 1 Complete!** ✅  
All dependencies and permissions are now configured. Proceed to Stage 2.
