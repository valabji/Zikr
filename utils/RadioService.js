import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIO_CONSTANTS } from '../constants/RadioConstants';
import QuranAudio from './QuranAudio';
import Sounds from './Sounds';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

class RadioService {
  constructor() {
    this.sound = null;
    this.activeStation = null;
    this.isPlaying = false;
    this.isBuffering = false;
    this.audioModeReady = false;
    this.listeners = new Set();
  }

  async initialize() {
    await this._ensureAudioMode();
  }

  async _ensureAudioMode() {
    if (this.audioModeReady) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.audioModeReady = true;
    } catch (e) {
      console.warn('RadioService: setAudioModeAsync failed', e);
    }
  }

  _state() {
    return { activeStation: this.activeStation, isPlaying: this.isPlaying, isBuffering: this.isBuffering };
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
        this.sound.setOnPlaybackStatusUpdate(null);
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }
  }

  async playStation(station) {
    if (!station || !station.streamUrl) return;
    await this._ensureAudioMode();
    try { await QuranAudio.stop(); } catch {}
    try { await Sounds.stopFullAdhan(); } catch {}
    await this._unload();
    this.activeStation = station;
    this.isPlaying = true;
    this.isBuffering = true;
    this._emit();
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.streamUrl },
        { shouldPlay: true }
      );
      this.sound = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if (status.error) {
            console.warn('RadioService: stream error', status.error);
            this.isPlaying = false;
            this.isBuffering = false;
            this._emit();
          }
          return;
        }
        const playing = !!status.isPlaying;
        const buffering = !!status.isBuffering && !status.isPlaying;
        if (playing !== this.isPlaying || buffering !== this.isBuffering) {
          this.isPlaying = playing;
          this.isBuffering = buffering;
          this._emit();
        }
      });
      this._persistLastPlayed(station);
    } catch (e) {
      console.warn('RadioService: playStation failed', e);
      this.isPlaying = false;
      this.isBuffering = false;
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
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      } else {
        await this.sound.playAsync();
        this.isPlaying = true;
      }
      this._emit();
    } catch (e) {
      console.warn('RadioService: toggle failed', e);
    }
  }

  async stop() {
    await this._unload();
    this.activeStation = null;
    this.isPlaying = false;
    this.isBuffering = false;
    this._emit();
  }
}

const instance = new RadioService();
export default instance;
