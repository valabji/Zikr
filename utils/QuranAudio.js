import { Audio } from 'expo-av';
import { buildAyahAudioUrl, DEFAULT_RECITER_ID } from '../constants/QuranReciters';
import { loadQuranSettings, subscribeQuranSettings } from './QuranSettings';
import pagesData from '../assets/quran/data/pages.json';

const flatVerses = [];
const verseIndex = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseIndex[`${a.surah}:${a.ayah}`] = flatVerses.length;
    flatVerses.push({ surah: a.surah, ayah: a.ayah, page: pg.page });
  }
}

class QuranAudioService {
  constructor() {
    this.sound = null;
    this.activeAyah = null;
    this.isPlaying = false;
    this.reciterId = DEFAULT_RECITER_ID;
    this.playbackScope = 'ayah';
    this.audioModeReady = false;
    this.listeners = new Set();
    this.unsubSettings = null;
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
      console.warn('QuranAudio: setAudioModeAsync failed', e);
    }
  }

  async _ensureSettings() {
    if (!this.unsubSettings) {
      const s = await loadQuranSettings();
      this.reciterId = s.reciterId || DEFAULT_RECITER_ID;
      this.playbackScope = s.audioPlaybackScope || 'ayah';
      this.unsubSettings = subscribeQuranSettings((next) => {
        const newReciter = next.reciterId || DEFAULT_RECITER_ID;
        if (newReciter !== this.reciterId) {
          this.reciterId = newReciter;
          if (this.activeAyah) {
            const { surah, ayah } = this.activeAyah;
            this.playAyah(surah, ayah);
          }
        }
        this.playbackScope = next.audioPlaybackScope || 'ayah';
      });
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn({ activeAyah: this.activeAyah, isPlaying: this.isPlaying });
    return () => this.listeners.delete(fn);
  }

  _emit() {
    const state = { activeAyah: this.activeAyah, isPlaying: this.isPlaying };
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

  async playAyah(surah, ayah) {
    await this._ensureAudioMode();
    await this._ensureSettings();
    await this._unload();
    const uri = buildAyahAudioUrl(this.reciterId, surah, ayah);
    this.activeAyah = { surah, ayah };
    this.isPlaying = true;
    this._emit();
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      this.sound = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if (status.error) {
            console.warn('QuranAudio: load error', status.error);
            this.isPlaying = false;
            this._emit();
          }
          return;
        }
        const next = status.isPlaying || status.isBuffering;
        if (next !== this.isPlaying) {
          this.isPlaying = next;
          this._emit();
        }
        if (status.didJustFinish) {
          this._advance();
        }
      });
    } catch (e) {
      console.warn('QuranAudio: playAyah failed', e);
      this.isPlaying = false;
      this._emit();
    }
  }

  async _advance() {
    if (!this.activeAyah) return;
    const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
    const idx = verseIndex[key];
    const nextIdx = idx + 1;
    if (nextIdx >= flatVerses.length) {
      await this.stop();
      return;
    }
    const current = flatVerses[idx];
    const next = flatVerses[nextIdx];
    const scope = this.playbackScope || 'ayah';
    if (scope === 'ayah') {
      await this.stop();
      return;
    }
    if (scope === 'page' && next.page !== current.page) {
      await this.stop();
      return;
    }
    if (scope === 'surah' && next.surah !== current.surah) {
      await this.stop();
      return;
    }
    await this.playAyah(next.surah, next.ayah);
  }

  async next() {
    if (!this.activeAyah) return;
    await this._advance();
  }

  async previous() {
    if (!this.activeAyah) return;
    const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
    const idx = verseIndex[key];
    const prevIdx = idx - 1;
    if (prevIdx < 0) return;
    const prev = flatVerses[prevIdx];
    await this.playAyah(prev.surah, prev.ayah);
  }

  async toggle() {
    if (!this.sound) {
      if (this.activeAyah) {
        await this.playAyah(this.activeAyah.surah, this.activeAyah.ayah);
      }
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
      console.warn('QuranAudio: toggle failed', e);
    }
  }

  async stop() {
    await this._unload();
    this.activeAyah = null;
    this.isPlaying = false;
    this._emit();
  }
}

const instance = new QuranAudioService();
export default instance;
export { flatVerses, verseIndex };
