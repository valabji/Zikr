import { Audio } from 'expo-av';
import { flatVerses, verseIndex } from './QuranAudio';
import wordsData from '../assets/quran/data/words.json';

const AMPLITUDE_THRESHOLD_DB = -35;
const WORD_ADVANCE_INTERVAL_MS = 600;
const POLL_INTERVAL_MS = 100;
const SPEAKING_GRACE_MS = 200;

function wordCountForAyah(surah, ayah) {
  const words = wordsData[`${surah}:${ayah}`];
  if (!words) return 1;
  return words.filter((w) => w.type !== 'end').length || 1;
}

class QuranVoiceFollowerService {
  constructor() {
    this.active = false;
    this.activeAyah = null;
    this.playingWordIdx = null;
    this._recording = null;
    this._pollTimer = null;
    this._advanceTimer = null;
    this._lastSpeakingAt = 0;
    this._listeners = new Set();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn({ active: this.active, activeAyah: this.activeAyah, playingWordIdx: this.playingWordIdx });
    return () => this._listeners.delete(fn);
  }

  _emit() {
    const state = { active: this.active, activeAyah: this.activeAyah, playingWordIdx: this.playingWordIdx };
    this._listeners.forEach((fn) => { try { fn(state); } catch {} });
  }

  async start(startAyah) {
    if (this.active) await this.stop();

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      this._recording = recording;
    } catch {
      return;
    }

    this.active = true;
    this.activeAyah = { surah: startAyah.surah, ayah: startAyah.ayah };
    this.playingWordIdx = 0;
    this._lastSpeakingAt = 0;
    this._emit();

    this._pollTimer = setInterval(async () => {
      if (!this._recording) return;
      try {
        const status = await this._recording.getStatusAsync();
        if (status.isRecording && typeof status.metering === 'number' && status.metering > AMPLITUDE_THRESHOLD_DB) {
          this._lastSpeakingAt = Date.now();
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    this._advanceTimer = setInterval(() => {
      if (!this.active) return;
      if (Date.now() - this._lastSpeakingAt > SPEAKING_GRACE_MS) return;
      this._advance();
    }, WORD_ADVANCE_INTERVAL_MS);
  }

  _advance() {
    if (!this.activeAyah) return;
    const count = wordCountForAyah(this.activeAyah.surah, this.activeAyah.ayah);
    const nextIdx = (this.playingWordIdx ?? 0) + 1;
    if (nextIdx < count) {
      this.playingWordIdx = nextIdx;
      this._emit();
      return;
    }
    const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
    const idx = verseIndex[key];
    const nextVerse = typeof idx === 'number' ? flatVerses[idx + 1] : null;
    if (nextVerse) {
      this.activeAyah = { surah: nextVerse.surah, ayah: nextVerse.ayah };
      this.playingWordIdx = 0;
    } else {
      this.playingWordIdx = count - 1;
    }
    this._emit();
  }

  async stop() {
    this.active = false;
    this.activeAyah = null;
    this.playingWordIdx = null;

    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._advanceTimer) { clearInterval(this._advanceTimer); this._advanceTimer = null; }

    if (this._recording) {
      try {
        await this._recording.stopAndUnloadAsync();
      } catch {}
      this._recording = null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch {}

    this._emit();
  }
}

const instance = new QuranVoiceFollowerService();
export default instance;
