# Stage 4: Audio System Integration

**Stage**: 4 of 10  
**Estimated Time**: 2 hours  
**Complexity**: Medium  
**Prerequisites**: Stages 1-3 complete (dependencies + audio + notification service)

---

## 🎯 Objective

Integrate the audio system with notifications to support TWO separate audio playback modes:
1. **Short Alert** - Plays automatically when notification fires (3-5 seconds)
2. **Full Adhan** - Plays when user taps notification (2-3 minutes, stoppable)

Update the existing `Sounds.js` utility to handle both modes correctly.

---

## 📋 Tasks Checklist

- [ ] Read existing Sounds.js implementation
- [ ] Add second audio player instance (for full adhan)
- [ ] Implement playShortAlert() method
- [ ] Implement playFullAdhan() method
- [ ] Implement stopFullAdhan() method
- [ ] Add notification response handler
- [ ] Handle audio interruptions
- [ ] Test short alert auto-play
- [ ] Test full adhan on notification tap
- [ ] Test stopping full adhan

---

## 📁 File to Edit

**Location**: `utils/Sounds.js`

**Current Status**: Exists, has basic audio playback for beep sound

**What You'll Do**: Extend it to support two audio players (short + full)

---

## 🔍 Step 1: Read Existing Implementation

### Read Current Sounds.js

```bash
# Read the file to understand current implementation
# File location: utils/Sounds.js
```

**What to look for**:
- Existing audio player instance
- How audio is currently loaded
- Existing playback methods
- Export pattern

**Expected**: Simple audio system with one player for beep sound

---

## 🔧 Step 2: Update Sounds.js

### Complete Updated Implementation

Replace the contents of `utils/Sounds.js` with:

```javascript
import { Audio } from 'expo-av';

/**
 * Sounds - Audio playback utility for prayer reminders
 * 
 * Supports TWO separate audio modes:
 * 1. Short Alert - Auto-plays when notification fires (3-5 sec)
 * 2. Full Adhan - Plays when user taps notification (2-3 min, stoppable)
 * 
 * Why two players?
 * - Prevents conflicts when user taps notification while short alert playing
 * - Allows stopping full adhan without affecting short alerts
 */
class Sounds {
  constructor() {
    this.shortAlertSound = null;  // 3-5 second alert
    this.fullAdhanSound = null;   // 2-3 minute full adhan
    this.isInitialized = false;
    this.isPlayingFullAdhan = false;
  }

  /**
   * Initialize audio system
   * MUST be called before playing any audio
   */
  async initialize() {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,  // CRITICAL: Play even in silent mode
        staysActiveInBackground: true, // Keep playing in background
        shouldDuckAndroid: true,      // Lower other audio when playing
        playThroughEarpieceAndroid: false,
      });

      // Load short alert sound
      const { sound: shortSound } = await Audio.Sound.createAsync(
        require('../assets/sound/adhan_short_alert.mp3'),
        { shouldPlay: false }
      );
      this.shortAlertSound = shortSound;

      // Load full adhan sound
      const { sound: fullSound } = await Audio.Sound.createAsync(
        require('../assets/sound/adhan_full.mp3'),
        { shouldPlay: false }
      );
      this.fullAdhanSound = fullSound;

      // Set up playback status listener for full adhan
      this.fullAdhanSound.setOnPlaybackStatusUpdate(this._onFullAdhanPlaybackUpdate);

      this.isInitialized = true;
      console.log('✅ Audio system initialized');

    } catch (error) {
      console.error('Error initializing audio system:', error);
      throw error;
    }
  }

  /**
   * Play short alert (auto-plays on notification)
   * 3-5 seconds, non-interruptible
   * 
   * @returns {Promise<void>}
   */
  async playShortAlert() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.shortAlertSound) {
        console.error('Short alert sound not loaded');
        return;
      }

      // Stop and reset if already playing
      const status = await this.shortAlertSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.shortAlertSound.stopAsync();
      }

      // Reset to beginning
      await this.shortAlertSound.setPositionAsync(0);

      // Play short alert
      await this.shortAlertSound.playAsync();
      console.log('🔊 Playing short alert');

    } catch (error) {
      console.error('Error playing short alert:', error);
    }
  }

  /**
   * Play full adhan (plays when user taps notification)
   * 2-3 minutes, user can stop
   * 
   * @returns {Promise<void>}
   */
  async playFullAdhan() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.fullAdhanSound) {
        console.error('Full adhan sound not loaded');
        return;
      }

      // Stop if already playing
      const status = await this.fullAdhanSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.fullAdhanSound.stopAsync();
      }

      // Reset to beginning
      await this.fullAdhanSound.setPositionAsync(0);

      // Play full adhan
      await this.fullAdhanSound.playAsync();
      this.isPlayingFullAdhan = true;
      console.log('🔊 Playing full adhan');

    } catch (error) {
      console.error('Error playing full adhan:', error);
      this.isPlayingFullAdhan = false;
    }
  }

  /**
   * Stop full adhan playback
   * User can call this to stop the full adhan
   * 
   * @returns {Promise<void>}
   */
  async stopFullAdhan() {
    try {
      if (!this.fullAdhanSound) {
        return;
      }

      const status = await this.fullAdhanSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.fullAdhanSound.stopAsync();
        console.log('⏹️ Stopped full adhan');
      }

      this.isPlayingFullAdhan = false;

    } catch (error) {
      console.error('Error stopping full adhan:', error);
      this.isPlayingFullAdhan = false;
    }
  }

  /**
   * Check if full adhan is currently playing
   * 
   * @returns {boolean}
   */
  isFullAdhanPlaying() {
    return this.isPlayingFullAdhan;
  }

  /**
   * Playback status update handler for full adhan
   * Automatically updates isPlayingFullAdhan flag
   * 
   * @private
   */
  _onFullAdhanPlaybackUpdate = (status) => {
    if (status.isLoaded) {
      this.isPlayingFullAdhan = status.isPlaying;

      // If finished playing, reset
      if (status.didJustFinish) {
        this.isPlayingFullAdhan = false;
        console.log('✅ Full adhan finished');
      }
    }
  };

  /**
   * Play audio based on notification data
   * Called when notification is received or tapped
   * 
   * @param {string} soundType - 'short' or 'full'
   * @param {boolean} isTapped - True if user tapped notification
   */
  async playNotificationSound(soundType, isTapped = false) {
    try {
      if (soundType === 'short' && !isTapped) {
        // Auto-play short alert when notification fires
        await this.playShortAlert();
      } else if (soundType === 'full' && isTapped) {
        // Play full adhan when user taps notification
        await this.playFullAdhan();
      } else if (soundType === 'short' && isTapped) {
        // User tapped notification with short alert - play full adhan
        await this.playFullAdhan();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Clean up audio resources
   * Call when app is closing
   */
  async cleanup() {
    try {
      if (this.shortAlertSound) {
        await this.shortAlertSound.unloadAsync();
        this.shortAlertSound = null;
      }

      if (this.fullAdhanSound) {
        await this.fullAdhanSound.unloadAsync();
        this.fullAdhanSound = null;
      }

      this.isInitialized = false;
      console.log('🧹 Audio system cleaned up');

    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  }

  /**
   * Legacy method - kept for backwards compatibility
   * Plays beep sound from existing implementation
   */
  async playBeep() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Use short alert for beep functionality
      await this.playShortAlert();
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  }
}

// Export singleton instance
export default new Sounds();
```

---

## 🔗 Step 3: Integrate with NotificationService

### Update NotificationService.js

**File**: `utils/NotificationService.js`

**Add import at top**:
```javascript
import Sounds from './Sounds';
```

**Add notification response handler in constructor**:

Find the constructor in NotificationService.js (around line 25-32) and add after the setNotificationHandler:

```javascript
constructor() {
  // Existing notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });

  // NEW: Add notification response handler
  this.setupNotificationListener();
}

/**
 * Setup notification listener for user interactions
 * Plays appropriate audio when notification is received or tapped
 */
setupNotificationListener() {
  // When notification is received (app in foreground)
  Notifications.addNotificationReceivedListener(async (notification) => {
    console.log('📩 Notification received:', notification.request.identifier);
    
    // Play short alert automatically
    const { soundType } = notification.request.content.data;
    if (soundType) {
      await Sounds.playNotificationSound(soundType, false);
    }
  });

  // When user taps notification (app in background)
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    console.log('👆 Notification tapped:', response.notification.request.identifier);
    
    // Play full adhan when tapped
    const { soundType } = response.notification.request.content.data;
    if (soundType) {
      await Sounds.playNotificationSound(soundType, true);
    }
  });
}
```

---

## ✅ Step 4: Initialize Audio on App Start

### Update App.js

**File**: `App.js` (root level)

**Add import**:
```javascript
import Sounds from './utils/Sounds';
```

**Add initialization in useEffect**:

Find or create a useEffect hook in App.js and add:

```javascript
useEffect(() => {
  // Initialize audio system
  const initAudio = async () => {
    try {
      await Sounds.initialize();
      console.log('Audio system ready');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  initAudio();

  // Cleanup on unmount
  return () => {
    Sounds.cleanup();
  };
}, []);
```

**If App.js doesn't have useEffect**, add this complete implementation:

```javascript
import React, { useEffect } from 'react';
import Sounds from './utils/Sounds';

export default function App() {
  useEffect(() => {
    // Initialize audio system
    Sounds.initialize().catch(err => 
      console.error('Audio init failed:', err)
    );

    // Cleanup
    return () => Sounds.cleanup();
  }, []);

  // ... rest of your App component
}
```

---

## 🧪 Step 5: Test Audio Integration

### Create Test Component

**Create**: `components/AudioNotificationTest.js` (temporary)

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import NotificationService from '../utils/NotificationService';
import Sounds from '../utils/Sounds';

export default function AudioNotificationTest() {
  const [isPlaying, setIsPlaying] = useState(false);

  const testShortAlert = async () => {
    await Sounds.playShortAlert();
  };

  const testFullAdhan = async () => {
    await Sounds.playFullAdhan();
    setIsPlaying(true);
  };

  const stopAdhan = async () => {
    await Sounds.stopFullAdhan();
    setIsPlaying(false);
  };

  const testNotificationWithShortAlert = async () => {
    // Schedule notification 5 seconds from now with short alert
    const triggerDate = new Date(Date.now() + 5000);
    const id = await NotificationService.scheduleExactNotification(
      'test_short',
      'Short Alert Test',
      'This notification will play a short alert',
      triggerDate,
      'short'
    );

    if (id) {
      Alert.alert('Success', 'Notification scheduled with short alert for 5 seconds from now');
    }
  };

  const testNotificationWithFullAdhan = async () => {
    // Schedule notification 5 seconds from now with full adhan
    const triggerDate = new Date(Date.now() + 5000);
    const id = await NotificationService.scheduleExactNotification(
      'test_full',
      'Full Adhan Test',
      'Tap this notification to play full adhan',
      triggerDate,
      'full'
    );

    if (id) {
      Alert.alert('Success', 'Notification scheduled. When it appears, TAP IT to hear full adhan');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio + Notification Test</Text>
      
      <Text style={styles.sectionTitle}>Direct Audio Test</Text>
      <TouchableOpacity style={styles.button} onPress={testShortAlert}>
        <Text style={styles.buttonText}>Play Short Alert (3-5 sec)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isPlaying && styles.playing]} 
        onPress={testFullAdhan}
      >
        <Text style={styles.buttonText}>Play Full Adhan (2-3 min)</Text>
      </TouchableOpacity>
      
      {isPlaying && (
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={stopAdhan}
        >
          <Text style={styles.buttonText}>Stop Full Adhan</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.sectionTitle}>Notification + Audio Test</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={testNotificationWithShortAlert}
      >
        <Text style={styles.buttonText}>Schedule Notification (Short Alert)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testNotificationWithFullAdhan}
      >
        <Text style={styles.buttonText}>Schedule Notification (Full Adhan)</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        Instructions:{'\n'}
        1. Test direct audio playback first{'\n'}
        2. Schedule notification with short alert - it will auto-play{'\n'}
        3. Schedule notification with full adhan - TAP IT to play{'\n'}
        4. Verify you can stop full adhan mid-playback
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  playing: { backgroundColor: '#34C759' },
  dangerButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16 },
  instructions: { marginTop: 20, fontSize: 14, color: '#666', lineHeight: 20 },
});
```

### Add to App Temporarily

**Edit**: `App.js`

```javascript
import AudioNotificationTest from './components/AudioNotificationTest';

// In return:
<AudioNotificationTest />
```

### Run Tests

```bash
npx expo run:android  # Physical device required
```

**Test Sequence**:

1. **Direct Audio Test**:
   - Click "Play Short Alert" → Should hear 3-5 second audio
   - Click "Play Full Adhan" → Should hear 2-3 minute audio
   - Click "Stop Full Adhan" → Audio should stop immediately

2. **Notification + Short Alert Test**:
   - Click "Schedule Notification (Short Alert)"
   - Wait 5 seconds
   - **Expected**: Notification appears + short alert plays AUTOMATICALLY
   - **Timing**: Audio should play within 1-2 seconds of notification

3. **Notification + Full Adhan Test**:
   - Click "Schedule Notification (Full Adhan)"
   - Wait 5 seconds
   - Notification appears (NO auto-play)
   - **Tap the notification**
   - **Expected**: Full adhan plays when tapped
   - **Verify**: Can stop by clicking "Stop Full Adhan"

**Success Criteria**:
- ✅ Short alert plays automatically on notification
- ✅ Full adhan plays only when notification is tapped
- ✅ Full adhan can be stopped mid-playback
- ✅ No audio conflicts between short and full
- ✅ Audio plays even with phone in silent mode

### Remove Test Code

```bash
# Windows:
del components\AudioNotificationTest.js

# Mac/Linux:
rm components/AudioNotificationTest.js
```

Remove `<AudioNotificationTest />` from `App.js`

---

## 📁 Project Structure After This Stage

```
Zikr/
├── utils/
│   ├── Sounds.js                    # ✅ UPDATED (two audio players)
│   ├── NotificationService.js       # ✅ UPDATED (notification listeners)
│   └── ... other utils
├── App.js                           # ✅ UPDATED (audio initialization)
└── ... rest of project
```

---

## ✅ Acceptance Criteria

Before moving to Stage 5, verify:

- [ ] Sounds.js updated with two audio players
- [ ] playShortAlert() method implemented
- [ ] playFullAdhan() method implemented
- [ ] stopFullAdhan() method implemented
- [ ] NotificationService.js has notification listeners
- [ ] App.js initializes audio on startup
- [ ] Short alert plays automatically on notification
- [ ] Full adhan plays ONLY when notification tapped
- [ ] Full adhan can be stopped
- [ ] Audio plays in silent mode (iOS critical)
- [ ] No audio conflicts between short and full players

---

## 🐛 Common Issues and Solutions

### Issue 1: Audio Doesn't Play on iOS

**Symptoms**: Notification appears but no sound on iPhone

**Solutions**:
1. Check `playsInSilentModeIOS: true` in Sounds.js
2. Verify phone is NOT in silent mode (flip switch on side)
3. Check notification permission includes sound
4. iOS requires background audio capability (added in Stage 1)

### Issue 2: Full Adhan Won't Stop

**Symptoms**: stopFullAdhan() doesn't stop playback

**Solutions**:
1. Verify fullAdhanSound is loaded: `await this.fullAdhanSound.getStatusAsync()`
2. Check isPlayingFullAdhan flag
3. Try: `await this.fullAdhanSound.pauseAsync()` instead of stop

### Issue 3: Audio Cuts Off Other Apps

**Symptoms**: Music/podcasts stop when alert plays

**Solutions**:
1. This is expected behavior with `shouldDuckAndroid: true`
2. Android setting: "Mix notification sounds" (not controllable by app)
3. Consider reducing alert volume

### Issue 4: "Audio File Not Found" Error

**Symptoms**: Error loading adhan_short_alert.mp3 or adhan_full.mp3

**Solutions**:
1. Verify files exist: `ls assets/sound/adhan*.mp3`
2. Check file names match exactly (case-sensitive)
3. Restart metro bundler: `npx expo start --clear`

### Issue 5: Short Alert Plays When Tapping Notification

**Symptoms**: Both short and full audio play on tap

**Solutions**:
1. Check notification listener logic in NotificationService.js
2. Verify `isTapped` parameter in playNotificationSound()
3. Ensure notification data has correct `soundType`

---

## 📝 Verification Commands

```bash
# Verify Sounds.js has new methods
grep "playShortAlert" utils/Sounds.js
grep "playFullAdhan" utils/Sounds.js
grep "stopFullAdhan" utils/Sounds.js

# Verify NotificationService has listeners
grep "addNotificationReceivedListener" utils/NotificationService.js
grep "addNotificationResponseReceivedListener" utils/NotificationService.js

# Verify App.js initializes audio
grep "Sounds.initialize" App.js

# Check audio files exist
ls -l assets/sound/adhan_short_alert.mp3
ls -l assets/sound/adhan_full.mp3
```

---

## 📤 Git Commit

Once Stage 4 is complete and verified:

```bash
git add utils/Sounds.js
git add utils/NotificationService.js
git add App.js
git commit -m "feat: stage 4 - integrate audio system with notifications

- Update Sounds.js with two separate audio players
- Implement playShortAlert() and playFullAdhan() methods
- Add stopFullAdhan() for user control
- Integrate notification listeners in NotificationService
- Initialize audio system in App.js
- Test short alert auto-play on notification
- Test full adhan playback on notification tap
- Verify audio works in silent mode

Stage 4 of 10 complete"
```

---

## ➡️ Next Stage

**Stage 5**: Settings Screen UI
- Add exact alarm status indicator
- Add battery optimization guidance
- Add audio mode toggles (short/full)
- Add prayer selection checkboxes

**Location**: `stages/STAGE_05_SETTINGS_SCREEN.md`

---

**Stage 4 Complete!** ✅  
Audio system integrated with notifications. Two-player system works correctly. Proceed to Stage 5.
