import { Audio, InterruptionModeIOS } from 'expo-av';
import { buildAyahAudioUrl, DEFAULT_RECITER_ID } from '../constants/QuranReciters';
import { loadQuranSettings, subscribeQuranSettings } from './QuranSettings';
import { getSurahAudioManifest } from './QuranSurahAudio';
import QuranSurahDownloader from './QuranSurahDownloader';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import { ayahPageForLayout, pageAyahsForLayout } from './mushafLayout';
import pagesData from '../assets/quran/data/pages.json';
import wordsData from '../assets/quran/data/words.json';

const flatVerses = [];
const verseIndex = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseIndex[`${a.surah}:${a.ayah}`] = flatVerses.length;
    flatVerses.push({ surah: a.surah, ayah: a.ayah, page: pg.page });
  }
}

// During the silence between two words, keep the finished word highlighted
// rather than pre-lighting the next one.
function segWordIdx(segs, pos) {
  let idx = segs[segs.length - 1][0] - 1;
  for (let i = 0; i < segs.length; i++) {
    const [w, s, e] = segs[i];
    if (pos < s) { idx = i > 0 ? segs[i - 1][0] - 1 : w - 1; break; }
    if (pos < e) { idx = w - 1; break; }
  }
  return idx;
}

class QuranAudioService {
  constructor() {
    this.sound = null;
    this.activeAyah = null;
    this.isPlaying = false;
    this.playingWordIdx = null;
    this.reciterId = DEFAULT_RECITER_ID;
    this.playbackScope = 'ayah';
    this.loopEnabled = false;
    this.playbackRate = 1.0;
    this.listeners = new Set();
    this.unsubSettings = null;
    this.mode = 'ayah';
    this.surahManifest = null;
    this.ayahSegments = null;
    this._timingPtr = 0;
    this.gaplessScope = null;
    this.gaplessPage = null;
    this.segEndAyah = null;
    this.segEndMs = null;
    this._advancing = false;
    this._opId = 0;
  }

  async _ensureAudioMode() {
    try {
      // DoNotMix required for iOS Now Playing; re-applied each play since Sounds/MicTest overwrite the global mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('QuranAudio: setAudioModeAsync failed', e);
    }
  }

  async _ensureSettings() {
    if (!this.unsubSettings) {
      const s = await loadQuranSettings();
      this.reciterId = s.reciterId || DEFAULT_RECITER_ID;
      this.playbackScope = s.audioPlaybackScope || 'ayah';
      this.loopEnabled = s.loopEnabled === true;
      this.playbackRate = typeof s.playbackRate === 'number' ? s.playbackRate : 1.0;
      this.mushafEdition = s.mushafEdition;
      this.unsubSettings = subscribeQuranSettings((next) => {
        this.mushafEdition = next.mushafEdition;
        const newReciter = next.reciterId || DEFAULT_RECITER_ID;
        const reciterChanged = newReciter !== this.reciterId;
        this.reciterId = newReciter;
        const newScope = next.audioPlaybackScope || 'ayah';
        const scopeChanged = newScope !== this.playbackScope;
        this.playbackScope = newScope;
        this.loopEnabled = next.loopEnabled === true;
        if ((reciterChanged || scopeChanged) && this.activeAyah) {
          const { surah, ayah } = this.activeAyah;
          this.playAyah(surah, ayah);
        }
        const newRate = typeof next.playbackRate === 'number' ? next.playbackRate : 1.0;
        if (newRate !== this.playbackRate) {
          this.playbackRate = newRate;
          if (this.sound) {
            this.sound.setRateAsync(this.playbackRate, true).catch(() => {});
          }
        }
      });
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn({ activeAyah: this.activeAyah, isPlaying: this.isPlaying, playingWordIdx: this.playingWordIdx });
    return () => this.listeners.delete(fn);
  }

  _emit() {
    const state = { activeAyah: this.activeAyah, isPlaying: this.isPlaying, playingWordIdx: this.playingWordIdx };
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
    this.playingWordIdx = null;
  }

  async playAyah(surah, ayah) {
    await this._ensureAudioMode();
    await this._ensureSettings();
    const scope = this.playbackScope;
    if (scope === 'page' || scope === 'surah' || scope === 'mushaf') {
      if (scope === 'page') this.gaplessPage = this._pageOf(surah, ayah);
      return this._playGapless(surah, ayah, scope);
    }
    return this._playAyahFile(surah, ayah);
  }

  _layoutFile() {
    return getMushafEdition(this.mushafEdition).layoutFile;
  }

  _pageOf(surah, ayah) {
    return ayahPageForLayout(this._layoutFile(), `${surah}:${ayah}`) || 1;
  }

  async _playAyahFile(surah, ayah) {
    const op = ++this._opId;
    await this._ensureAudioMode();
    await this._ensureSettings();
    await this._unload();
    if (op !== this._opId) return;
    this.mode = 'ayah';
    this.surahManifest = null;
    this._advancing = false;
    try { require('./RadioService').default.stop(); } catch {}
    const uri = buildAyahAudioUrl(this.reciterId, surah, ayah);
    this.activeAyah = { surah, ayah };
    this.isPlaying = true;
    this._emit();
    this.ayahSegments = null;
    getSurahAudioManifest(this.reciterId, surah)
      .then((m) => {
        if (op !== this._opId || !m) return;
        const t = m.verseTimings.find((v) => v.ayah === ayah);
        if (t && t.segments && t.segments.length) this.ayahSegments = t.segments;
      })
      .catch(() => {});
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: this.playbackRate, shouldCorrectPitch: true, progressUpdateIntervalMillis: 100 }
      );
      if (op !== this._opId) {
        try { sound.setOnPlaybackStatusUpdate(null); await sound.unloadAsync(); } catch {}
        return;
      }
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
        if (status.didJustFinish) {
          this._advance();
          return;
        }
        const next = status.isPlaying || status.isBuffering;
        let changed = next !== this.isPlaying;
        if (changed) this.isPlaying = next;

        if (this.activeAyah && status.isPlaying) {
          const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
          const wordCount = (wordsData[key] || []).length || 1;
          const dur = status.durationMillis || 1;
          const segs = this.ayahSegments;
          let wordIdx;
          if (segs && segs.length) {
            const t0 = segs[0][1];
            const span = segs[segs.length - 1][2] - t0;
            wordIdx = segWordIdx(segs, t0 + (status.positionMillis / dur) * span);
          } else {
            wordIdx = Math.floor((status.positionMillis / dur) * wordCount);
          }
          wordIdx = Math.max(0, Math.min(wordCount - 1, wordIdx));
          if (wordIdx !== this.playingWordIdx) {
            this.playingWordIdx = wordIdx;
            changed = true;
          }
        }

        if (changed) this._emit();
      });
    } catch (e) {
      if (op !== this._opId) return;
      console.warn('QuranAudio: playAyah failed', e);
      this.isPlaying = false;
      this._emit();
    }
  }

  async _playGapless(surah, fromAyah, scope) {
    const op = ++this._opId;
    const manifest = await getSurahAudioManifest(this.reciterId, surah);
    if (!manifest) return this._playAyahFile(surah, fromAyah);
    await this._unload();
    if (op !== this._opId) return;
    this.mode = 'gapless';
    this.gaplessScope = scope;
    this.surahManifest = manifest;
    this._timingPtr = 0;
    this._advancing = false;
    try { require('./RadioService').default.stop(); } catch {}
    const vt = manifest.verseTimings;
    const start = vt.find((v) => v.ayah === fromAyah) || vt[0];
    const lastAyah = vt[vt.length - 1].ayah;
    const endAyah = this._segEndAyah(manifest, scope);
    const endTiming = vt.find((v) => v.ayah === endAyah) || vt[vt.length - 1];
    this.segEndAyah = endAyah;
    this.segEndMs = endAyah < lastAyah ? endTiming.to : null;
    this.activeAyah = { surah, ayah: start.ayah };
    this.isPlaying = true;
    this.playingWordIdx = null;
    this._emit();
    const localUri = await QuranSurahDownloader.getLocalAudioUri(this.reciterId, surah);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri || manifest.audioUrl },
        {
          shouldPlay: true,
          rate: this.playbackRate,
          shouldCorrectPitch: true,
          positionMillis: start.from,
          progressUpdateIntervalMillis: 100,
          // iOS seeks with infinite tolerance unless these are set, landing far from the ayah start.
          seekMillisToleranceBefore: 0,
          seekMillisToleranceAfter: 0,
        }
      );
      if (op !== this._opId) {
        try { sound.setOnPlaybackStatusUpdate(null); await sound.unloadAsync(); } catch {}
        return;
      }
      this.sound = sound;
      sound.setOnPlaybackStatusUpdate((status) => this._onGaplessStatus(status));
    } catch (e) {
      if (op !== this._opId) return;
      console.warn('QuranAudio: playGapless failed', e);
      this.isPlaying = false;
      this._emit();
    }
  }

  _segEndAyah(manifest, scope) {
    const last = manifest.verseTimings[manifest.verseTimings.length - 1].ayah;
    if (scope === 'page') {
      const inSurah = pageAyahsForLayout(this._layoutFile(), this.gaplessPage)
        .filter((a) => a.surah === manifest.surah).map((a) => a.ayah);
      if (inSurah.length) return Math.min(last, Math.max(...inSurah));
    }
    return last;
  }

  _nextPageAyah(curSurah, endAyah) {
    const endIdx = verseIndex[`${curSurah}:${endAyah}`];
    for (const a of pageAyahsForLayout(this._layoutFile(), this.gaplessPage)) {
      if (verseIndex[`${a.surah}:${a.ayah}`] > endIdx) return a;
    }
    return null;
  }

  async _gaplessAdvance() {
    if (this._advancing) return;
    this._advancing = true;
    const scope = this.gaplessScope;
    const curSurah = this.surahManifest ? this.surahManifest.surah
      : (this.activeAyah ? this.activeAyah.surah : 1);

    if (scope === 'page') {
      const nextAyah = this._nextPageAyah(curSurah, this.segEndAyah);
      if (nextAyah) return this._playGapless(nextAyah.surah, nextAyah.ayah, 'page');
      if (this.loopEnabled) {
        const first = pageAyahsForLayout(this._layoutFile(), this.gaplessPage)[0];
        if (first) return this._playGapless(first.surah, first.ayah, 'page');
      }
      return this.stop();
    }

    if (scope === 'surah') {
      if (this.loopEnabled) return this._playGapless(curSurah, 1, 'surah');
      return this.stop();
    }

    const nextSurah = curSurah >= QURAN_CONSTANTS.SURAH_COUNT ? 1 : curSurah + 1;
    return this._playGapless(nextSurah, 1, 'mushaf');
  }

  _onGaplessStatus(status) {
    if (!status.isLoaded) {
      if (status.error) {
        console.warn('QuranAudio: surah load error', status.error);
        this.isPlaying = false;
        this._emit();
      }
      return;
    }
    if (status.didJustFinish) {
      this._gaplessAdvance();
      return;
    }
    const m = this.surahManifest;
    if (!m) return;
    const pos = status.positionMillis || 0;
    if (!this._advancing && this.segEndMs != null && pos >= this.segEndMs) {
      this._gaplessAdvance();
      return;
    }
    let changed = false;
    const next = status.isPlaying || status.isBuffering;
    if (next !== this.isPlaying) { this.isPlaying = next; changed = true; }

    const timing = this._timingAt(pos);
    if (timing) {
      if (!this.activeAyah || this.activeAyah.ayah !== timing.ayah || this.activeAyah.surah !== m.surah) {
        this.activeAyah = { surah: m.surah, ayah: timing.ayah };
        changed = true;
      }
      const wordIdx = this._wordAt(timing, pos);
      if (wordIdx !== this.playingWordIdx) { this.playingWordIdx = wordIdx; changed = true; }
    }
    if (changed) this._emit();
  }

  _timingAt(pos) {
    const vt = this.surahManifest.verseTimings;
    let i = Math.max(0, Math.min(this._timingPtr, vt.length - 1));
    while (i < vt.length - 1 && pos >= vt[i + 1].from) i++;
    while (i > 0 && pos < vt[i].from) i--;
    this._timingPtr = i;
    return vt[i];
  }

  _wordAt(timing, pos) {
    const segs = timing.segments;
    if (!segs || !segs.length) return null;
    const key = `${this.surahManifest.surah}:${timing.ayah}`;
    const count = (wordsData[key] || []).length || 1;
    return Math.max(0, Math.min(count - 1, segWordIdx(segs, pos)));
  }

  async _seekToAyah(targetAyah) {
    const m = this.surahManifest;
    if (!m || !this.sound) return;
    const t = m.verseTimings.find((v) => v.ayah === targetAyah);
    if (!t) {
      if (targetAyah < m.verseTimings[0].ayah) {
        try { await this.sound.setPositionAsync(0); } catch {}
        return;
      }
      if (this.loopEnabled) {
        this._timingPtr = 0;
        try { await this.sound.setPositionAsync(0); await this.sound.playAsync(); } catch {}
      } else {
        await this.stop();
      }
      return;
    }
    try {
      await this.sound.setPositionAsync(t.from, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
      await this.sound.setRateAsync(this.playbackRate, true);
      await this.sound.playAsync();
      this.activeAyah = { surah: m.surah, ayah: targetAyah };
      this.isPlaying = true;
      this.playingWordIdx = null;
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: seek failed', e);
    }
  }

  _scopeStart(current, scope) {
    if (scope === 'page') return flatVerses.find((v) => v.page === current.page) || current;
    if (scope === 'surah') return flatVerses.find((v) => v.surah === current.surah) || current;
    return current;
  }

  async _advance() {
    if (!this.activeAyah) return;
    const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
    const idx = verseIndex[key];
    const current = flatVerses[idx];
    const scope = this.playbackScope || 'ayah';
    const loop = !!this.loopEnabled;

    if (scope === 'ayah') {
      if (loop) {
        await this._playAyahFile(current.surah, current.ayah);
      } else {
        await this.stop();
      }
      return;
    }

    const nextIdx = idx + 1;
    const atEnd = nextIdx >= flatVerses.length;
    const next = atEnd ? null : flatVerses[nextIdx];

    if (scope === 'mushaf') {
      const target = atEnd ? flatVerses[0] : next;
      await this._playAyahFile(target.surah, target.ayah);
      return;
    }

    const boundary = atEnd
      || (scope === 'page' && next.page !== current.page)
      || (scope === 'surah' && next.surah !== current.surah);

    if (boundary) {
      if (loop) {
        const restart = this._scopeStart(current, scope);
        await this._playAyahFile(restart.surah, restart.ayah);
      } else {
        await this.stop();
      }
      return;
    }
    await this._playAyahFile(next.surah, next.ayah);
  }

  async next() {
    if (!this.activeAyah) return;
    if (this.mode === 'gapless' && this.surahManifest) {
      const target = this.activeAyah.ayah + 1;
      const withinSeg = this.segEndAyah == null || target <= this.segEndAyah;
      if (withinSeg && this.surahManifest.verseTimings.some((v) => v.ayah === target)) {
        return this._seekToAyah(target);
      }
      return this._gaplessAdvance();
    }
    await this._advance();
  }

  async previous() {
    if (!this.activeAyah) return;
    if (this.mode === 'gapless' && this.surahManifest) {
      return this._seekToAyah(this.activeAyah.ayah - 1);
    }
    const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
    const idx = verseIndex[key];
    const prevIdx = idx - 1;
    if (prevIdx < 0) return;
    const prev = flatVerses[prevIdx];
    await this._playAyahFile(prev.surah, prev.ayah);
  }

  async play() {
    if (!this.sound) {
      if (this.activeAyah) await this.playAyah(this.activeAyah.surah, this.activeAyah.ayah);
      return;
    }
    try {
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded || status.isPlaying) return;
      await this.sound.setRateAsync(this.playbackRate, true);
      await this.sound.playAsync();
      this.isPlaying = true;
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: play failed', e);
    }
  }

  async pause() {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded || !status.isPlaying) return;
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: pause failed', e);
    }
  }

  async seekToMs(ms) {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(ms, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
    } catch (e) {
      console.warn('QuranAudio: seekToMs failed', e);
    }
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
        await this.sound.setRateAsync(this.playbackRate, true);
        await this.sound.playAsync();
        this.isPlaying = true;
      }
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: toggle failed', e);
    }
  }

  async setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.sound) {
      try { await this.sound.setRateAsync(rate, true); } catch (e) { console.warn('QuranAudio: setRateAsync failed', e); }
    }
  }

  async stop() {
    this._opId++;
    await this._unload();
    this.mode = 'ayah';
    this.surahManifest = null;
    this.gaplessScope = null;
    this.segEndAyah = null;
    this.segEndMs = null;
    this._advancing = false;
    this._timingPtr = 0;
    this.activeAyah = null;
    this.isPlaying = false;
    this.playingWordIdx = null;
    this._emit();
  }
}

const instance = new QuranAudioService();
export default instance;
export { flatVerses, verseIndex };
