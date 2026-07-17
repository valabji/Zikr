import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { flatVerses } from '@/utils/quran/mushafIndex';
import wordsData from '@assets/quran/data/words.json';
import { normalizeArabic, tokenize, matchPosition, findResync } from '@/utils/quran/quranRecitationMatch';
import { VOICE_FOLLOW_DEBUG as DEBUG } from '@/utils/quran/quranDebug';

const RECOGNITION_LANG = 'ar-SA';
const FATAL_ERRORS = new Set(['service-not-allowed', 'language-not-supported', 'not-allowed', 'audio-capture']);
// Network recognition ignores `continuous` and can die after one utterance without
// firing `end`; on-device truly streams. The watchdog is a last resort for a fully
// silent recognizer (no events at all) — any lifecycle event resets it, so it never
// aborts a session that is still listening. Network results lag, so keep it generous.
const STALL_RESTART_MS_NETWORK = 6000;
const STALL_RESTART_MS_DEVICE = 10000;

const log = (...args) => { if (DEBUG) console.log('[VoiceFollow]', ...args); };

let _flatWords = null;
let _ayahStart = null;

function buildIndex() {
  if (_flatWords) return;
  _flatWords = [];
  _ayahStart = {};
  for (const v of flatVerses) {
    const key = `${v.surah}:${v.ayah}`;
    const words = wordsData[key];
    if (!words) continue;
    _ayahStart[key] = _flatWords.length;
    let wi = 0;
    for (const w of words) {
      if (w.type === 'end') continue;
      _flatWords.push({ surah: v.surah, ayah: v.ayah, wordIdx: wi, norm: normalizeArabic(w.ar) });
      wi += 1;
    }
  }
}

class QuranVoiceFollowerService {
  constructor() {
    this.active = false;
    this.paused = false;
    this.activeAyah = null;
    this.playingWordIdx = null;
    this.mistake = false;
    this.pendingPrompt = null;
    this._pos = 0;
    this._promptPos = null;
    this._subs = [];
    this._onDevice = false;
    this._watchdog = null;
    this._lastRelaunch = 0;
    this._listeners = new Set();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn(this._state());
    return () => this._listeners.delete(fn);
  }

  _state() {
    return {
      active: this.active, paused: this.paused, activeAyah: this.activeAyah,
      playingWordIdx: this.playingWordIdx, mistake: this.mistake, pendingPrompt: this.pendingPrompt,
    };
  }

  _emit() {
    const state = this._state();
    this._listeners.forEach((fn) => { try { fn(state); } catch {} });
  }

  async start(startAyah) {
    log('start requested', startAyah);
    if (this.active) await this.stop();

    let granted = false;
    try {
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      granted = !!(res && res.granted);
      log('permission', res);
    } catch (err) {
      log('permission request failed', err);
      return;
    }
    if (!granted) { log('permission denied, aborting'); return; }

    buildIndex();
    const key = `${startAyah.surah}:${startAyah.ayah}`;
    this._pos = _ayahStart[key] ?? 0;
    log('index built', { words: _flatWords.length, startKey: key, startPos: this._pos });

    this.active = true;
    this.paused = false;
    this.mistake = false;
    this.pendingPrompt = null;
    this._promptPos = null;
    this.activeAyah = { surah: startAyah.surah, ayah: startAyah.ayah };
    this.playingWordIdx = 0;
    this._emit();

    try { this._onDevice = !!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(); } catch { this._onDevice = false; }
    log('onDevice recognition supported:', this._onDevice);
    this._attachListeners();
    this._startRecognition();
  }

  _attachListeners() {
    this._detach();
    this._subs.push(ExpoSpeechRecognitionModule.addListener('result', (e) => this._onResult(e)));
    this._subs.push(ExpoSpeechRecognitionModule.addListener('error', (e) => this._onError(e)));
    this._subs.push(ExpoSpeechRecognitionModule.addListener('end', () => this._onEnd()));
    ['start', 'audiostart', 'audioend', 'speechstart', 'speechend', 'nomatch'].forEach((name) => {
      this._subs.push(ExpoSpeechRecognitionModule.addListener(name, () => {
        this._armWatchdog();
        if (DEBUG) log('event:', name);
      }));
    });
  }

  _detach() {
    this._subs.forEach((s) => { try { s.remove(); } catch {} });
    this._subs = [];
  }

  _startRecognition() {
    const opts = {
      lang: RECOGNITION_LANG,
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: this._onDevice,
      addsPunctuation: false,
    };
    log('startRecognition', opts);
    try {
      ExpoSpeechRecognitionModule.start(opts);
    } catch (err) {
      log('startRecognition threw', err);
    }
    this._armWatchdog();
  }

  _armWatchdog() {
    this._clearWatchdog();
    if (!this.active || this.paused) return;
    const ms = this._onDevice ? STALL_RESTART_MS_DEVICE : STALL_RESTART_MS_NETWORK;
    this._watchdog = setTimeout(() => {
      this._watchdog = null;
      if (!this.active || this.paused) return;
      log('watchdog stall, relaunching recognizer');
      this._relaunch('stall');
    }, ms);
  }

  _clearWatchdog() {
    if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; }
  }

  _relaunch(reason) {
    if (!this.active || this.paused) return;
    const now = Date.now();
    if (now - this._lastRelaunch < 500) { log('relaunch skipped (debounce)', reason); return; }
    this._lastRelaunch = now;
    log('relaunch', reason);
    this._clearWatchdog();
    try { ExpoSpeechRecognitionModule.abort(); } catch {}
    this._startRecognition();
  }

  _onResult(e) {
    if (!this.active || this.paused || this.pendingPrompt) { log('result ignored', { paused: this.paused, prompt: !!this.pendingPrompt }); return; }
    this._armWatchdog();
    const transcript = e && e.results && e.results[0] && e.results[0].transcript;
    if (!transcript) { log('result with empty transcript', e && e.isFinal); return; }
    const isFinal = !!(e && e.isFinal);
    const tokens = tokenize(transcript);
    const next = matchPosition(_flatWords, this._pos, tokens);
    log('result', { isFinal, transcript, tokens, fromPos: this._pos, nextPos: next, mistake: this.mistake });
    if (next !== this._pos) {
      this.mistake = false;
      this._applyPos(next);
      return;
    }
    // Keep the mic open; only interrupt when the recited words are confidently
    // found further ahead (a real skip). Plain mishears leave the cursor put.
    if (this.mistake || !isFinal || !tokens.length) return;
    const candidate = findResync(_flatWords, this._pos, tokens, _flatWords.length, 2);
    if (candidate < 0 || candidate === this._pos) return;
    const fw = _flatWords[candidate];
    this._promptPos = candidate;
    this.pendingPrompt = { surah: this.activeAyah.surah, ayah: this.activeAyah.ayah, toSurah: fw.surah, toAyah: fw.ayah };
    log('prompt: detected skip ahead, asking lookahead vs mistake', { from: this._pos, to: candidate });
    this._emit();
  }

  resolvePrompt(action) {
    if (!this.pendingPrompt) return;
    log('resolvePrompt', action);
    const pos = this._promptPos;
    this.pendingPrompt = null;
    this._promptPos = null;
    if (action === 'lookahead') {
      this.mistake = false;
      if (pos != null && pos >= 0 && pos !== this._pos) this._applyPos(pos);
      else this._emit();
    } else if (action === 'mistake') {
      this.mistake = true;
      this._emit();
    } else {
      this.mistake = false;
      this._emit();
    }
  }

  _applyPos(p) {
    const fw = _flatWords[p];
    if (!fw) return;
    this._pos = p;
    this.activeAyah = { surah: fw.surah, ayah: fw.ayah };
    this.playingWordIdx = fw.wordIdx;
    log('advance ->', { pos: p, ayah: `${fw.surah}:${fw.ayah}`, wordIdx: fw.wordIdx, word: fw.norm });
    this._emit();
  }

  // The recognizer restarts the segment on silence and may need on-device
  // fallback to network; we relaunch on end so following stays continuous.
  _onEnd() {
    log('recognizer ended', { active: this.active, paused: this.paused });
    if (this.active && !this.paused) this._relaunch('end');
  }

  _onError(e) {
    const code = e && e.error;
    log('error event', { code, message: e && e.message });
    if (this._onDevice && (code === 'language-not-supported' || code === 'service-not-allowed')) {
      log('falling back to network recognition');
      this._onDevice = false;
      return;
    }
    if (FATAL_ERRORS.has(code)) { log('fatal error, stopping'); this.stop(); }
  }

  pause() {
    if (!this.active || this.paused) return;
    log('pause');
    this.paused = true;
    this._clearWatchdog();
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
    this._emit();
  }

  resume() {
    if (!this.active || !this.paused) return;
    log('resume');
    this.paused = false;
    this._emit();
    this._startRecognition();
  }

  async stop() {
    log('stop');
    this.active = false;
    this.paused = false;
    this.mistake = false;
    this.pendingPrompt = null;
    this._promptPos = null;
    this.activeAyah = null;
    this.playingWordIdx = null;
    this._pos = 0;
    this._clearWatchdog();
    this._detach();
    try { ExpoSpeechRecognitionModule.abort(); } catch {}
    this._emit();
  }
}

const instance = new QuranVoiceFollowerService();
export default instance;
