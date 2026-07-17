import { createAudioPlayer } from 'expo-audio';
import { buildAyahAudioUrl } from '@/constants/QuranReciters';
import { flatVerses, verseIndex } from './mushafIndex';
import { dlog } from './quranWordTiming';

export const preloadMethods = {
  // remove() alone frees the native player only on JS GC; pause first so audio stops now
  _disposePlayer(player) {
    try { player.pause(); } catch {}
    try { player.remove(); } catch {}
  },

  _discardPreload() {
    if (this._preload) {
      this._disposePlayer(this._preload.player);
      this._preload = null;
    }
  },

  _takePreload(surah, ayah) {
    const preload = this._preload;
    if (!preload) return null;
    this._preload = null;
    if (preload.surah === surah && preload.ayah === ayah) return preload.player;
    dlog('preload mismatch: had', `${preload.surah}:${preload.ayah}`, 'wanted', `${surah}:${ayah}`);
    this._disposePlayer(preload.player);
    return null;
  },

  _preloadNextAyah() {
    this._discardPreload();
    const target = this._nextAyahTarget();
    if (!target) return;
    const uri = buildAyahAudioUrl(this.reciterId, target.surah, target.ayah);
    dlog('preload', `${target.surah}:${target.ayah}`, uri);
    try {
      this._preload = { surah: target.surah, ayah: target.ayah, player: createAudioPlayer({ uri }, { updateInterval: 100 }) };
    } catch {}
  },

  _scopeStart(current, scope) {
    if (scope === 'page') return flatVerses.find((v) => v.page === current.page) || current;
    if (scope === 'surah') return flatVerses.find((v) => v.surah === current.surah) || current;
    return current;
  },

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
  },
};
