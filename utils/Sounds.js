import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const audioSource = require('../assets/sound/kikhires.mp3');
const VOLUME_KEY = '@zikr/click_volume';

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
const SoundsService = new Sounds();
export default SoundsService;

// Keep the existing useAudio hook for backward compatibility
export function useAudio() {
    const [volume, setVolume] = useState(0.9);
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        loadVolume();
        initPlayer();
    }, []);

    useEffect(() => {
        if (player) {
            player.setVolumeAsync(volume);
        }
    }, [volume, player]);

    const initPlayer = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                audioSource,
                { shouldPlay: false }
            );
            setPlayer(sound);
        } catch (error) {
            console.error('Error initializing audio player:', error);
        }
    };

    const loadVolume = async () => {
        try {
            const savedVolume = await AsyncStorage.getItem(VOLUME_KEY);
            if (savedVolume !== null) {
                setVolume(parseFloat(savedVolume));
            }
        } catch (e) {
            console.warn('Failed to load volume setting:', e);
        }
    };

    const setClickVolume = async (newVolume) => {
        try {
            await AsyncStorage.setItem(VOLUME_KEY, newVolume.toString());
            setVolume(newVolume);
        } catch (e) {
            console.warn('Failed to save volume setting:', e);
        }
    };

    return {
        playClick: async (customVolume=false) => {
            if (!player) return;
            
            let actualVolume;
            if (customVolume !== false) {
                // Use custom volume for preview (like slider)
                actualVolume = customVolume;
                await player.setVolumeAsync(customVolume);
            } else {
                // Use stored volume from AsyncStorage for all other clicks
                await loadVolume();
                actualVolume = volume;
                await player.setVolumeAsync(volume);
            }
            
            // Only play if volume is greater than 0
            if (actualVolume > 0) {
                await player.setPositionAsync(0);
                await player.playAsync();
            }
        },
        volume,
        setClickVolume
    }
}