import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { buildAyahAudioUrl, DEFAULT_RECITER_ID } from '../constants/QuranReciters';
import { loadQuranSettings, subscribeQuranSettings } from './QuranSettings';
import { getSurahAudioManifest } from './QuranSurahAudio';
import QuranSurahDownloader from './QuranSurahDownloader';
import { QURAN_CONSTANTS, getMushafEdition } from '../constants/QuranConstants';
import { ayahPageForLayout, pageAyahsForLayout } from './mushafLayout';
import pagesData from '../assets/quran/data/pages.json';
import wordsData from '../assets/quran/data/words.json';

const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__ && !process.env.JEST_WORKER_ID;
function dlog(...args) {
  if (DEBUG) console.log('[QuranAudio]', ...args);
}

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

  // remove() alone frees the native player only on JS GC; pause first so audio stops now
  _disposePlayer(player) {
    try { player.pause(); } catch {}
    try { player.remove(); } catch {}
  }

  _discardPreload() {
    if (this._preload) {
      this._disposePlayer(this._preload.player);
      this._preload = null;
    }
  }

  _takePreload(surah, ayah) {
    const p = this._preload;
    if (!p) return null;
    this._preload = null;
    if (p.surah === surah && p.ayah === ayah) return p.player;
    dlog('preload mismatch: had', `${p.surah}:${p.ayah}`, 'wanted', `${surah}:${ayah}`);
    this._disposePlayer(p.player);
    return null;
  }

  _preloadNextAyah() {
    this._discardPreload();
    const target = this._nextAyahTarget();
    if (!target) return;
    const uri = buildAyahAudioUrl(this.reciterId, target.surah, target.ayah);
    dlog('preload', `${target.surah}:${target.ayah}`, uri);
    try {
      this._preload = { surah: target.surah, ayah: target.ayah, player: createAudioPlayer({ uri }, { updateInterval: 100 }) };
    } catch {}
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

  // Seeking in the loaded file avoids the audible gap a player rebuild causes
  _canSeekGapless(surah, ayah, scope, page) {
    return this.mode === 'gapless'
      && !!this.player
      && this.gaplessScope === scope
      && this.gaplessReciterId === this.reciterId
      && (scope !== 'page' || page === this.gaplessPage)
      && !!this.surahManifest
      && this.surahManifest.surah === surah
      && this.surahManifest.verseTimings.some((v) => v.ayah === ayah);
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
          const wordCount = (wordsData[key] || []).length || 1;
          const dur = status.duration || 1;
          const segs = this.ayahSegments;
          let wordIdx;
          if (segs && segs.length) {
            const t0 = segs[0][1];
            const span = segs[segs.length - 1][2] - t0;
            wordIdx = segWordIdx(segs, t0 + (status.currentTime / dur) * span);
          } else {
            wordIdx = Math.floor((status.currentTime / dur) * wordCount);
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
    if (op !== this._opId) return;
    if (!manifest) return this._playAyahFile(surah, fromAyah);
    await this._unload();
    if (op !== this._opId) return;
    this.mode = 'gapless';
    this.gaplessScope = scope;
    this.gaplessReciterId = this.reciterId;
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
    if (op !== this._opId) return;
    dlog('gapless play', `${surah}:${start.ayah}`, scope, localUri ? 'local' : 'stream', localUri || manifest.audioUrl, 'from', start.from, 'segEnd', this.segEndMs);
    try {
      const player = this._createPlayer(localUri || manifest.audioUrl);
      await player.seekTo(start.from / 1000, 0, 0);
      if (op !== this._opId) return;
      player.play();
      this._statusSub = player.addListener('playbackStatusUpdate', (status) => this._onGaplessStatus(status));
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
        if (first) {
          if (this._canSeekGapless(first.surah, first.ayah, 'page', this.gaplessPage)) return this._seekToAyah(first.ayah);
          return this._playGapless(first.surah, first.ayah, 'page');
        }
      }
      return this.stop();
    }

    if (scope === 'surah') {
      if (this.loopEnabled) {
        const firstAyah = this.surahManifest ? this.surahManifest.verseTimings[0].ayah : 1;
        if (this._canSeekGapless(curSurah, firstAyah, 'surah', null)) return this._seekToAyah(firstAyah);
        return this._playGapless(curSurah, 1, 'surah');
      }
      return this.stop();
    }

    const nextSurah = curSurah >= QURAN_CONSTANTS.SURAH_COUNT ? 1 : curSurah + 1;
    return this._playGapless(nextSurah, 1, 'mushaf');
  }

  _onGaplessStatus(status) {
    this._logAudible(status);
    if (status.didJustFinish) {
      dlog('gapless finished, advancing');
      this._gaplessAdvance();
      return;
    }
    const m = this.surahManifest;
    if (!m) return;
    const pos = (status.currentTime || 0) * 1000;
    if (!this._advancing && this.segEndMs != null && pos >= this.segEndMs) {
      this._gaplessAdvance();
      return;
    }
    let changed = false;
    const next = status.playing || status.isBuffering;
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
    if (!m || !this.player) return;
    // supersede any in-flight play so its continuation can't unload this player
    this._opId++;
    this._advancing = false;
    const t = m.verseTimings.find((v) => v.ayah === targetAyah);
    if (!t) {
      if (targetAyah < m.verseTimings[0].ayah) {
        try { await this.player.seekTo(0, 0, 0); } catch {}
        return;
      }
      if (this.loopEnabled) {
        this._timingPtr = 0;
        try { await this.player.seekTo(0, 0, 0); this.player.play(); } catch {}
      } else {
        await this.stop();
      }
      return;
    }
    dlog('seek in place to', `${m.surah}:${targetAyah}`, 'at', t.from / 1000, 's');
    try {
      await this.player.seekTo(t.from / 1000, 0, 0);
      this.player.setPlaybackRate(this.playbackRate, 'high');
      this.player.play();
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

  _nextAyahTarget() {
    if (!this.activeAyah) return null;
    const idx = verseIndex[`${this.activeAyah.surah}:${this.activeAyah.ayah}`];
    const current = flatVerses[idx];
    const scope = this.playbackScope || 'ayah';
    const loop = !!this.loopEnabled;

    if (scope === 'ayah') return loop ? current : null;

    const nextIdx = idx + 1;
    const atEnd = nextIdx >= flatVerses.length;
    const next = atEnd ? null : flatVerses[nextIdx];

    if (scope === 'mushaf') return atEnd ? flatVerses[0] : next;

    const boundary = atEnd
      || (scope === 'page' && next.page !== current.page)
      || (scope === 'surah' && next.surah !== current.surah);

    if (boundary) return loop ? this._scopeStart(current, scope) : null;
    return next;
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

const instance = new QuranAudioService();
export default instance;
export { flatVerses, verseIndex };
