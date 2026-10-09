import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIO_CONSTANTS } from '@/constants/RadioConstants';
import QuranAudio from '@/utils/quran/QuranAudio';
import Sounds from '@/utils/audio/Sounds';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

class RadioService {
  constructor() {
    this.sound = null;
    this._statusSub = null;
    this.activeStation = null;
    this.isPlaying = false;
    this.isBuffering = false;
    this.failedStationId = null;
    this.listeners = new Set();
    this._opId = 0;
  }

  async initialize() {
    await this._ensureAudioMode();
  }

  async _ensureAudioMode() {
    try {
      // DoNotMix required for iOS Now Playing; re-applied each play since Sounds/MicTest overwrite the global mode
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false,
      });
    } catch (e) {
      console.warn('RadioService: setAudioModeAsync failed', e);
    }
  }

  _state() {
    return {
      activeStation: this.activeStation,
      isPlaying: this.isPlaying,
      isBuffering: this.isBuffering,
      failedStationId: this.failedStationId,
    };
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this._state());
    return () => this.listeners.delete(fn);
  }

  _emit() {
    const state = this._state();
    this.listeners.forEach((fn) => { try { fn(state); } catch {} });
  }

  async _unload() {
    if (this.sound) {
      try {
        this._statusSub?.remove();
        this._statusSub = null;
        // Stop immediately; remove() can defer native disposal until JS GC on iOS.
        try { this.sound.pause(); } catch {}
        this.sound.remove();
      } catch {}
      this.sound = null;
    }
  }

  async playStation(station) {
    if (!station || !station.streamUrl) return;
    const op = ++this._opId;
    await this._ensureAudioMode();
    if (op !== this._opId) return;
    try { await QuranAudio.stop(); } catch {}
    if (op !== this._opId) return;
    try { await Sounds.stopFullAdhan(); } catch {}
    if (op !== this._opId) return;
    await this._unload();
    if (op !== this._opId) return;
    this.activeStation = station;
    this.isPlaying = true;
    this.isBuffering = true;
    this.failedStationId = null;
    this._emit();
    try {
      const sound = createAudioPlayer({ uri: station.streamUrl });
      this.sound = sound;
      this._statusSub = sound.addListener('playbackStatusUpdate', (status) => {
        if (op !== this._opId) return;
        if (!status.isLoaded || status.error) {
          if (status.error) {
            console.warn('RadioService: stream error', status.error);
            this.isPlaying = false;
            this.isBuffering = false;
            this.failedStationId = this.activeStation ? this.activeStation.id : null;
            this._emit();
          }
          return;
        }
        const playing = !!status.playing;
        const buffering = !!status.isBuffering && !status.playing;
        if (playing !== this.isPlaying || buffering !== this.isBuffering) {
          this.isPlaying = playing;
          this.isBuffering = buffering;
          this._emit();
        }
      });
      sound.play();
      this._persistLastPlayed(station);
    } catch (e) {
      if (op !== this._opId) return;
      await this._unload();
      console.warn('RadioService: playStation failed', e);
      this.isPlaying = false;
      this.isBuffering = false;
      this.failedStationId = station.id;
      this._emit();
    }
  }

  async _persistLastPlayed(station) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(station));
    } catch {}
  }

  async toggle() {
    if (!this.sound) {
      if (this.activeStation) await this.playStation(this.activeStation);
      return;
    }
    try {
      const status = this.sound.currentStatus;
      if (!status.isLoaded) return;
      if (status.playing) {
        this.sound.pause();
        this.isPlaying = false;
      } else {
        this.sound.play();
        this.isPlaying = true;
      }
      this._emit();
    } catch (e) {
      console.warn('RadioService: toggle failed', e);
    }
  }

  async stop() {
    this._opId++;
    await this._unload();
    this.activeStation = null;
    this.isPlaying = false;
    this.isBuffering = false;
    this.failedStationId = null;
    this._emit();
  }
}

const instance = new RadioService();
export default instance;
