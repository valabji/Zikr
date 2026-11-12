import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { buildAyahAudioUrl, DEFAULT_RECITER_ID } from '@/constants/QuranReciters';
import { loadQuranSettings, subscribeQuranSettings } from '@/utils/quran/QuranSettings';
import { getSurahAudioManifest } from '@/utils/quran/QuranSurahAudio';
import { getMushafEdition } from '@/constants/QuranConstants';
import { ayahPageForLayout, flatVerses, verseIndex } from '@/utils/quran/mushafIndex';
import { DEBUG, dlog, fileWordIdx } from '@/utils/quran/quranWordTiming';
import { gaplessMethods } from '@/utils/quran/quranGapless';
import { preloadMethods } from '@/utils/quran/quranPreload';

class QuranAudioService {
  constructor() {
    this.player = null;
    this._statusSub = null;
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
    this.gaplessReciterId = null;
    this.segEndAyah = null;
    this.segEndMs = null;
    this._advancing = false;
    this._opId = 0;
    this._watchdog = null;
    this._preload = null;
  }

  async _ensureAudioMode() {
    try {
      // doNotMix required for iOS Now Playing; re-applied each play since Sounds/MicTest overwrite the global mode
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        interruptionModeAndroid: 'duckOthers',
        shouldRouteThroughEarpiece: false,
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
          if (this.player) {
            try { this.player.setPlaybackRate(newRate, 'high'); } catch {}
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

  _clearWatchdog() {
    if (this._watchdog) {
      clearInterval(this._watchdog);
      this._watchdog = null;
    }
  }

  // iOS emits no playbackStatusUpdate on a failed load, so poll until loaded or failed
  _startLoadWatchdog(player) {
    this._clearWatchdog();
    let ticks = 0;
    this._watchdog = setInterval(() => {
      if (this.player !== player) return this._clearWatchdog();
      const st = player.currentStatus;
      if (!st || st.isLoaded || st.playing) return this._clearWatchdog();
      if (st.playbackState === 'failed' || ++ticks >= 60) {
        console.warn('QuranAudio: load failed', st.playbackState);
        this._unload();
        this.isPlaying = false;
        this._emit();
      }
    }, 500);
    this._watchdog.unref?.();
  }

  async _unload() {
    this._clearWatchdog();
    this._discardPreload();
    if (this.player) {
      try { if (this._statusSub) this._statusSub.remove(); } catch {}
      this._disposePlayer(this.player);
      this.player = null;
      this._statusSub = null;
    }
    this.playingWordIdx = null;
  }

  async playAyah(surah, ayah) {
    await this._ensureAudioMode();
    await this._ensureSettings();
    const scope = this.playbackScope;
    if (scope === 'page' || scope === 'surah' || scope === 'mushaf') {
      const page = scope === 'page' ? this._pageOf(surah, ayah) : null;
      if (this._canSeekGapless(surah, ayah, scope, page)) return this._seekToAyah(ayah);
      if (scope === 'page') this.gaplessPage = page;
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

  _createPlayer(uri) {
    return this._adoptPlayer(createAudioPlayer({ uri }, { updateInterval: 100 }));
  }

  _adoptPlayer(player) {
    this.player = player;
    this._loadStartAt = Date.now();
    player.shouldCorrectPitch = true;
    player.setPlaybackRate(this.playbackRate, 'high');
    this._startLoadWatchdog(player);
    return player;
  }

  _logAudible(status) {
    if (this._loadStartAt && status.playing) {
      dlog('audible after', Date.now() - this._loadStartAt, 'ms', 'state', status.playbackState);
      this._loadStartAt = null;
    }
    if (DEBUG && status.playbackState !== this._lastState) {
      this._lastState = status.playbackState;
      dlog('state', status.playbackState, 'buffering', !!status.isBuffering, 't', status.currentTime);
    }
  }

  async _playAyahFile(surah, ayah) {
    const op = ++this._opId;
    await this._ensureAudioMode();
    await this._ensureSettings();
    if (op !== this._opId) return;
    const preloaded = this._takePreload(surah, ayah);
    await this._unload();
    if (op !== this._opId) {
      if (preloaded) this._disposePlayer(preloaded);
      return;
    }
    this.mode = 'ayah';
    this.surahManifest = null;
    this._advancing = false;
    try { require('@/utils/radio/RadioService').default.stop(); } catch {}
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
    dlog('ayah play', `${surah}:${ayah}`, preloaded ? 'preloaded' : 'cold', uri);
    try {
      const player = preloaded ? this._adoptPlayer(preloaded) : this._createPlayer(uri);
      player.play();
      this._preloadNextAyah();
      this._statusSub = player.addListener('playbackStatusUpdate', (status) => {
        this._logAudible(status);
        if (status.didJustFinish) {
          dlog('finished', `${surah}:${ayah}`);
          if (!this._advancing) {
            this._advancing = true;
            this._advance();
          }
          return;
        }
        const next = status.playing || status.isBuffering;
        let changed = next !== this.isPlaying;
        if (changed) this.isPlaying = next;

        if (this.activeAyah && status.playing) {
          const key = `${this.activeAyah.surah}:${this.activeAyah.ayah}`;
          const wordIdx = fileWordIdx(key, status.currentTime, status.duration, this.ayahSegments);
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

  async _advance() {
    if (!this.activeAyah) return;
    const target = this._nextAyahTarget();
    dlog('advance to', target ? `${target.surah}:${target.ayah}` : 'stop');
    if (!target) return this.stop();
    await this._playAyahFile(target.surah, target.ayah);
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
    if (!this.player) {
      if (this.activeAyah) await this.playAyah(this.activeAyah.surah, this.activeAyah.ayah);
      return;
    }
    try {
      if (this.player.playing) return;
      this.player.setPlaybackRate(this.playbackRate, 'high');
      this.player.play();
      this.isPlaying = true;
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: play failed', e);
    }
  }

  async pause() {
    if (!this.player) return;
    try {
      if (!this.player.playing) return;
      this.player.pause();
      this.isPlaying = false;
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: pause failed', e);
    }
  }

  async seekToMs(ms) {
    if (!this.player) return;
    try {
      await this.player.seekTo(ms / 1000, 0, 0);
    } catch (e) {
      console.warn('QuranAudio: seekToMs failed', e);
    }
  }

  async toggle() {
    if (!this.player) {
      if (this.activeAyah) {
        await this.playAyah(this.activeAyah.surah, this.activeAyah.ayah);
      }
      return;
    }
    try {
      if (this.player.playing) {
        this.player.pause();
        this.isPlaying = false;
      } else {
        this.player.setPlaybackRate(this.playbackRate, 'high');
        this.player.play();
        this.isPlaying = true;
      }
      this._emit();
    } catch (e) {
      console.warn('QuranAudio: toggle failed', e);
    }
  }

  async setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.player) {
      try { this.player.setPlaybackRate(rate, 'high'); } catch (e) { console.warn('QuranAudio: setPlaybackRate failed', e); }
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

Object.assign(QuranAudioService.prototype, preloadMethods, gaplessMethods);

const instance = new QuranAudioService();
export default instance;
export { flatVerses, verseIndex };
