import { getSurahAudioManifest } from './QuranSurahAudio';
import QuranSurahDownloader from './QuranSurahDownloader';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { pageAyahsForLayout, verseIndex } from './mushafIndex';
import { dlog, gaplessWordIdx } from './quranWordTiming';

export const gaplessMethods = {
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
  },

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
  },

  _segEndAyah(manifest, scope) {
    const last = manifest.verseTimings[manifest.verseTimings.length - 1].ayah;
    if (scope === 'page') {
      const inSurah = pageAyahsForLayout(this._layoutFile(), this.gaplessPage)
        .filter((a) => a.surah === manifest.surah).map((a) => a.ayah);
      if (inSurah.length) return Math.min(last, Math.max(...inSurah));
    }
    return last;
  },

  _nextPageAyah(curSurah, endAyah) {
    const endIdx = verseIndex[`${curSurah}:${endAyah}`];
    for (const a of pageAyahsForLayout(this._layoutFile(), this.gaplessPage)) {
      if (verseIndex[`${a.surah}:${a.ayah}`] > endIdx) return a;
    }
    return null;
  },

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
  },

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
  },

  _wordAt(timing, pos) {
    return gaplessWordIdx(`${this.surahManifest.surah}:${timing.ayah}`, timing.segments, pos);
  },

  _timingAt(pos) {
    const vt = this.surahManifest.verseTimings;
    let i = Math.max(0, Math.min(this._timingPtr, vt.length - 1));
    while (i < vt.length - 1 && pos >= vt[i + 1].from) i++;
    while (i > 0 && pos < vt[i].from) i--;
    this._timingPtr = i;
    return vt[i];
  },

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
  },
};
