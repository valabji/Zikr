# Stage 2: Audio Assets Preparation

**Stage**: 2 of 10  
**Estimated Time**: 2 hours  
**Complexity**: Easy  
**Prerequisites**: Stage 1 complete (dependencies installed)

---

## 🎯 Objective

Prepare and add two audio files for the adhan notifications:
1. **Short Alert** (3-5 seconds) - Quick notification sound
2. **Full Adhan** (2-3 minutes) - Complete call to prayer

Both files must be optimized for mobile, compressed to reasonable sizes, and placed in the correct asset folder.

---

## 📋 Tasks Checklist

- [ ] Source or create short alert audio file
- [ ] Source or create full adhan audio file
- [ ] Convert to MP3 format
- [ ] Compress short alert to <100KB
- [ ] Compress full adhan to <2MB
- [ ] Add files to assets/sound/ folder
- [ ] Test audio playback in app
- [ ] Verify files load correctly

---

## 📁 Current Audio Assets

**Location**: `assets/sound/`

**Existing Files**:
- `beep.mp3` - Currently used for notifications
- Other sound files may exist

**What You'll Add**:
- `adhan_short_alert.mp3` - New short alert (3-5 sec, <100KB)
- `adhan_full.mp3` - New full adhan (2-3 min, <2MB)

---

## 🎵 Step 1: Source Audio Files

### Option A: Use Existing Recordings (Recommended)

**Find royalty-free Islamic adhan recordings**:
- Search: "royalty free adhan mp3"
- Search: "creative commons adhan audio"
- Search: "islamic call to prayer free download"

**Recommended sources**:
- Freesound.org (search "adhan" or "azan")
- Islamic audio websites with explicit permission
- Create your own recording

### Option B: Extract from YouTube (Verify License)

**Only if video explicitly allows downloads and reuse**:

```bash
# Install youtube-dl or yt-dlp if needed
pip install yt-dlp

# Download audio from YouTube video
yt-dlp -x --audio-format mp3 "VIDEO_URL"
```

**⚠️ CRITICAL**: Verify the audio license allows commercial/app use. Many recordings are copyrighted.

### Requirements for Audio Files

**Short Alert** (adhan_short_alert.mp3):
- Duration: 3-5 seconds
- Content: Opening phrase of adhan or simple tone
- Purpose: Quick notification sound
- Example: "Allahu Akbar" x2

**Full Adhan** (adhan_full.mp3):
- Duration: 2-3 minutes
- Content: Complete call to prayer
- Purpose: Full notification audio
- Example: Complete traditional adhan

---

## 🔧 Step 2: Convert to MP3 Format

### If files are already MP3
Skip this step, proceed to compression.

### If files are WAV, M4A, AAC, etc.

**Using FFmpeg** (recommended):

```bash
# Install FFmpeg if not installed
# Windows: Download from ffmpeg.org
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# Convert to MP3
ffmpeg -i input_file.wav -codec:a libmp3lame -qscale:a 2 output.mp3
```

**Using Online Converter**:
- Visit: cloudconvert.com
- Upload audio file
- Select "MP3" as output format
- Download converted file

---

## 📉 Step 3: Compress Audio Files

### Compress Short Alert (<100KB target)

**Using FFmpeg**:

```bash
# High compression for short alert
ffmpeg -i adhan_short_original.mp3 -codec:a libmp3lame -b:a 64k -ar 22050 -ac 1 adhan_short_alert.mp3

# Check file size
# Windows:
dir adhan_short_alert.mp3

# Mac/Linux:
ls -lh adhan_short_alert.mp3
```

**Parameters explained**:
- `-b:a 64k` - Bitrate 64kbps (lower = smaller file)
- `-ar 22050` - Sample rate 22.05kHz (lower = smaller file)
- `-ac 1` - Mono audio (smaller than stereo)

**Target**: 50-100KB for 3-5 second file

### Compress Full Adhan (<2MB target)

**Using FFmpeg**:

```bash
# Moderate compression for full adhan
ffmpeg -i adhan_full_original.mp3 -codec:a libmp3lame -b:a 96k -ar 44100 -ac 1 adhan_full.mp3

# Check file size
# Windows:
dir adhan_full.mp3

# Mac/Linux:
ls -lh adhan_full.mp3
```

**Parameters explained**:
- `-b:a 96k` - Bitrate 96kbps (good quality, reasonable size)
- `-ar 44100` - Sample rate 44.1kHz (standard quality)
- `-ac 1` - Mono audio

**Target**: 1-2MB for 2-3 minute file

### Adjust Compression if Needed

**If file too large** (>2MB for full adhan):
```bash
# Lower bitrate to 64k
ffmpeg -i adhan_full_original.mp3 -codec:a libmp3lame -b:a 64k -ar 44100 -ac 1 adhan_full.mp3
```

**If file too small** (<500KB for full adhan):
```bash
# Increase bitrate to 128k for better quality
ffmpeg -i adhan_full_original.mp3 -codec:a libmp3lame -b:a 128k -ar 44100 -ac 1 adhan_full.mp3
```

---

## 📂 Step 4: Add Files to Project

### Copy Files to Assets Folder

**Destination**: `assets/sound/`

**Windows Command Prompt**:
```bash
# Navigate to project root
cd d:\Valabji\Desktop\Projects\Zikr

# Copy files (adjust source paths to where your files are)
copy C:\Downloads\adhan_short_alert.mp3 assets\sound\
copy C:\Downloads\adhan_full.mp3 assets\sound\
```

**Mac/Linux Terminal**:
```bash
# Navigate to project root
cd /path/to/Zikr

# Copy files
cp ~/Downloads/adhan_short_alert.mp3 assets/sound/
cp ~/Downloads/adhan_full.mp3 assets/sound/
```

### Verify Files Copied

```bash
# List files in assets/sound/
# Windows:
dir assets\sound\adhan*.mp3

# Mac/Linux:
ls -lh assets/sound/adhan*.mp3
```

**Expected Output**:
```
adhan_short_alert.mp3  (50-100 KB)
adhan_full.mp3         (1-2 MB)
```

---

## 📁 Project Structure After This Stage

```
Zikr/
├── assets/
│   └── sound/
│       ├── beep.mp3                  # Existing
│       ├── adhan_short_alert.mp3    # ✅ NEW (50-100KB)
│       └── adhan_full.mp3           # ✅ NEW (1-2MB)
└── ... rest of project
```

---

## ✅ Step 5: Test Audio Files

### Quick Test with Existing Audio System

**File to check**: `utils/Sounds.js` (existing audio utility)

Create a temporary test component to verify audio loads:

**Create**: `components/AudioTest.js` (temporary file)

```javascript
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioTest() {
  const [shortSound, setShortSound] = React.useState();
  const [fullSound, setFullSound] = React.useState();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    loadSounds();
    return () => {
      if (shortSound) shortSound.unloadAsync();
      if (fullSound) fullSound.unloadAsync();
    };
  }, []);

  async function loadSounds() {
    try {
      const { sound: short } = await Audio.Sound.createAsync(
        require('../assets/sound/adhan_short_alert.mp3')
      );
      const { sound: full } = await Audio.Sound.createAsync(
        require('../assets/sound/adhan_full.mp3')
      );
      setShortSound(short);
      setFullSound(full);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function playShort() {
    if (shortSound) {
      await shortSound.replayAsync();
    }
  }

  async function playFull() {
    if (fullSound) {
      await fullSound.replayAsync();
    }
  }

  if (loading) return <Text>Loading audio...</Text>;
  if (error) return <Text style={{ color: 'red' }}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={playShort}>
        <Text style={styles.buttonText}>Play Short Alert</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={playFull}>
        <Text style={styles.buttonText}>Play Full Adhan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});
```

### Add Test to Main Screen Temporarily

**File to edit**: `screens/MainScreen.js`

Add temporary import and component:

```javascript
// At top of file
import AudioTest from '../components/AudioTest';

// Inside render, add temporarily:
<AudioTest />
```

### Run App and Test

```bash
npx expo start
```

**Press 'a' for Android or 'i' for iOS**

**Expected Behavior**:
1. App loads without errors
2. "Audio Test" component appears
3. Clicking "Play Short Alert" plays 3-5 second sound
4. Clicking "Play Full Adhan" plays 2-3 minute sound
5. Audio is clear and not distorted

**If errors occur**, check:
- File names match exactly (case-sensitive)
- Files are in `assets/sound/` folder
- Files are valid MP3 format
- App was restarted after adding files

### Remove Test Code

After verification:

```bash
# Delete test file
# Windows:
del components\AudioTest.js

# Mac/Linux:
rm components/AudioTest.js
```

Remove `<AudioTest />` from `MainScreen.js`

---

## ✅ Acceptance Criteria

Before moving to Stage 3, verify:

- [ ] `adhan_short_alert.mp3` exists in `assets/sound/`
- [ ] `adhan_full.mp3` exists in `assets/sound/`
- [ ] Short alert file is 50-100KB
- [ ] Full adhan file is 1-2MB
- [ ] Both files are MP3 format
- [ ] Short alert plays correctly (3-5 seconds)
- [ ] Full adhan plays correctly (2-3 minutes)
- [ ] Audio quality is acceptable (no distortion)
- [ ] Files have appropriate licensing for app use
- [ ] Test component removed

---

## 🐛 Common Issues and Solutions

### Issue 1: "Unable to Load Sound" Error

**Symptoms**: Error when trying to play audio in test

**Solutions**:
1. Check file name spelling (case-sensitive!)
2. Verify file path: `assets/sound/adhan_short_alert.mp3`
3. Restart app (Expo sometimes caches assets)
4. Run: `npx expo start --clear`

### Issue 2: Audio is Distorted or Low Quality

**Symptoms**: Crackling, muffled, or unclear sound

**Solutions**:
1. Increase bitrate: `-b:a 128k` instead of 96k
2. Check source file quality
3. Re-export from original source at higher quality

### Issue 3: File Size Too Large

**Symptoms**: Full adhan >5MB, slow to load

**Solutions**:
```bash
# More aggressive compression
ffmpeg -i adhan_full.mp3 -codec:a libmp3lame -b:a 64k -ar 22050 -ac 1 adhan_full_compressed.mp3
```

### Issue 4: FFmpeg Not Recognized

**Symptoms**: "ffmpeg is not recognized as a command"

**Solutions**:
- Windows: Download from ffmpeg.org, add to PATH
- Mac: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`
- Alternative: Use online converter (cloudconvert.com)

---

## 📝 Verification Commands

```bash
# Navigate to project
cd Zikr

# Check files exist
# Windows:
dir assets\sound\adhan*.mp3

# Mac/Linux:
ls -lh assets/sound/adhan*.mp3

# Verify file sizes (should see ~100KB and ~2MB)
# Windows:
dir assets\sound\adhan_short_alert.mp3
dir assets\sound\adhan_full.mp3

# Mac/Linux:
du -h assets/sound/adhan_short_alert.mp3
du -h assets/sound/adhan_full.mp3
```

**Expected Output**:
```
adhan_short_alert.mp3   75 KB
adhan_full.mp3          1.8 MB
```

---

## 📄 Audio File Specifications

### Short Alert (adhan_short_alert.mp3)
- **Format**: MP3
- **Duration**: 3-5 seconds
- **Bitrate**: 64 kbps
- **Sample Rate**: 22050 Hz
- **Channels**: Mono (1)
- **Size**: 50-100 KB
- **Purpose**: Quick notification sound

### Full Adhan (adhan_full.mp3)
- **Format**: MP3
- **Duration**: 2-3 minutes
- **Bitrate**: 96 kbps
- **Sample Rate**: 44100 Hz
- **Channels**: Mono (1)
- **Size**: 1-2 MB
- **Purpose**: Full call to prayer

---

## 📤 Git Commit

Once Stage 2 is complete and verified:

```bash
git add assets/sound/adhan_short_alert.mp3
git add assets/sound/adhan_full.mp3
git commit -m "feat: stage 2 - add adhan audio assets

- Add short alert sound (3-5 sec, optimized to <100KB)
- Add full adhan audio (2-3 min, optimized to <2MB)
- Compress to mobile-friendly sizes
- Verify playback quality

Stage 2 of 10 complete"
```

---

## ➡️ Next Stage

**Stage 3**: Notification Service Creation
- Create NotificationService.js utility
- Implement Android exact alarm scheduling
- Handle notification permissions
- Add battery optimization guidance

**Location**: `stages/STAGE_03_NOTIFICATION_SERVICE.md`

---

**Stage 2 Complete!** ✅  
Audio assets are ready for the adhan notification feature. Proceed to Stage 3.
