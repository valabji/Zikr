import { createAudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { useColors } from '@/constants/Colors';
import AdhanDownloader from '@/utils/prayer/AdhanDownloader';
import { SELECTED_ADHAN_KEY, DEFAULT_ADHAN_ID } from '@/constants/AdhanCatalog';

const audioSource = require('@assets/sound/kikhires.mp3');
const VOLUME_KEY = '@zikr/click_volume';

class Sounds {
  constructor() {
    this.shortAlertSound = null;
    this.fullAdhanSound = null;
    this.fullAdhanSubscription = null;
    this.fullAdhanSourceId = DEFAULT_ADHAN_ID;
    this.isInitialized = false;
    this.isPlayingFullAdhan = false;
  }

  async _ensureFullAdhanSource() {
    const selected = (await AsyncStorage.getItem(SELECTED_ADHAN_KEY)) || DEFAULT_ADHAN_ID;
    let uri = null;
    if (selected !== DEFAULT_ADHAN_ID) {
      uri = await AdhanDownloader.getPlayableUri(selected);
    }
    const resolvedId = uri ? selected : DEFAULT_ADHAN_ID;
    if (resolvedId === this.fullAdhanSourceId && this.fullAdhanSound) return;

    if (this.fullAdhanSound) {
      try { this.fullAdhanSubscription?.remove(); } catch {}
      this.fullAdhanSubscription = null;
      try { this.fullAdhanSound.pause(); } catch {}
      try { this.fullAdhanSound.remove(); } catch {}
      this.fullAdhanSound = null;
    }

    const source = uri ? { uri } : require('@assets/sound/adhan_full.mp3');
    const sound = createAudioPlayer(source);
    this.fullAdhanSound = sound;
    this.fullAdhanSubscription = this.fullAdhanSound.addListener('playbackStatusUpdate', this._onFullAdhanPlaybackUpdate);
    this.fullAdhanSourceId = resolvedId;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
      this.shortAlertSound = createAudioPlayer(require('@assets/sound/adhan_short_alert.mp3'));
      this.fullAdhanSound = createAudioPlayer(require('@assets/sound/adhan_full.mp3'));
      this.fullAdhanSubscription = this.fullAdhanSound.addListener('playbackStatusUpdate', this._onFullAdhanPlaybackUpdate);

      this.isInitialized = true;
      console.log('✅ Audio system initialized');

    } catch (error) {
      console.error('Error initializing audio system:', error);
      throw error;
    }
  }

  async playShortAlert() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.shortAlertSound) {
        console.error('Short alert sound not loaded');
        return;
      }

      const status = this.shortAlertSound.currentStatus;
      if (status.isLoaded && status.playing) {
        this.shortAlertSound.pause();
      }

      await this.shortAlertSound.seekTo(0);

      this.shortAlertSound.play();
      console.log('🔊 Playing short alert');

    } catch (error) {
      console.error('Error playing short alert:', error);
    }
  }

  async playFullAdhan() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this._ensureFullAdhanSource();

      if (!this.fullAdhanSound) {
        console.error('Full adhan sound not loaded');
        return;
      }

      const status = this.fullAdhanSound.currentStatus;
      if (status.isLoaded && status.playing) {
        this.fullAdhanSound.pause();
      }

      await this.fullAdhanSound.seekTo(0);

      this.fullAdhanSound.play();
      this.isPlayingFullAdhan = true;
      console.log('🔊 Playing full adhan');

    } catch (error) {
      console.error('Error playing full adhan:', error);
      this.isPlayingFullAdhan = false;
    }
  }

  async stopFullAdhan() {
    try {
      if (!this.fullAdhanSound) {
        return;
      }

      // Pause even while loading or buffering to cancel queued playback.
      this.fullAdhanSound.pause();
      console.log('⏹️ Stopped full adhan');

      this.isPlayingFullAdhan = false;

    } catch (error) {
      console.error('Error stopping full adhan:', error);
      this.isPlayingFullAdhan = false;
    }
  }

  isFullAdhanPlaying() {
    return this.isPlayingFullAdhan;
  }

  _onFullAdhanPlaybackUpdate = (status) => {
    if (status.isLoaded) {
      this.isPlayingFullAdhan = status.playing;

      if (status.didJustFinish) {
        this.isPlayingFullAdhan = false;
        console.log('✅ Full adhan finished');
      }
    }
  };

  async playNotificationSound(soundType, isTapped = false) {
    try {
      if (soundType === 'none') return;
      if (isTapped) {
        await this.playFullAdhan();
      } else {
        await this.playShortAlert();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  async cleanup() {
    try {
      if (this.fullAdhanSound) {
        try {
          this.fullAdhanSubscription?.remove();
          this.fullAdhanSubscription = null;
        } catch {}
      }

      if (this.shortAlertSound) {
        try { this.shortAlertSound.pause(); } catch {}
        this.shortAlertSound.remove();
        this.shortAlertSound = null;
      }

      if (this.fullAdhanSound) {
        try { this.fullAdhanSound.pause(); } catch {}
        this.fullAdhanSound.remove();
        this.fullAdhanSound = null;
      }

      this.isInitialized = false;
      this.isPlayingFullAdhan = false;
      this.fullAdhanSourceId = DEFAULT_ADHAN_ID;
      console.log('🧹 Audio system cleaned up');

    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  }

  async playBeep() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.playShortAlert();
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  }
}

const SoundsService = new Sounds();
export default SoundsService;

export function useAudio() {
    const colors = useColors();
    const [volume, setVolume] = useState(0.9);
    const player = useAudioPlayer(colors.clickSound ? { uri: colors.clickSound } : audioSource);

    useEffect(() => {
        loadVolume();
    }, []);

    useEffect(() => {
        player.volume = volume;
    }, [volume, player]);

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
                actualVolume = customVolume;
                player.volume = customVolume;
            } else {
                await loadVolume();
                actualVolume = volume;
                player.volume = volume;
            }

            if (actualVolume > 0) {
                await player.seekTo(0);
                player.play();
            }
        },
        volume,
        setClickVolume
    }
}
