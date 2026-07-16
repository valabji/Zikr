import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { reciterHasSurahAudio, getReciter } from '@/constants/QuranReciters';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { t, isRTL } from '@/locales/i18n';
import NotificationService from './NotificationService';
import { showDownloadProgress, hideDownloadProgress } from './quranDownloadNotifications';
import { getSurahAudioManifest } from './QuranSurahAudio';
import surahsData from '@assets/quran/data/surahs.json';

const ROOT = FileSystem.documentDirectory + 'quran/surah-mp3/';
const MIN_SIZE = 5000;
const SURAH_COUNT = QURAN_CONSTANTS.SURAH_COUNT;

function blankState() {
  return { downloaded: false, downloading: false, progress: 0, error: null, size: 0 };
}

class QuranSurahDownloaderService {
  constructor() {
    this.state = {};
    this.listeners = new Set();
    this.cancelled = {};
    this.checked = {};
    this.bulk = {};
    this._notifiedPct = {};
    this._permissionEnsured = false;
  }

  key(reciterId, surah) {
    return `${reciterId}:${surah}`;
  }

  _dir(reciterId) {
    return `${ROOT}${reciterId}/`;
  }

  _localUri(reciterId, surah) {
    return `${this._dir(reciterId)}${surah}.mp3`;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this._snapshot());
    return () => this.listeners.delete(fn);
  }

  _snapshot() {
    const snap = {};
    Object.keys(this.state).forEach((k) => { snap[k] = { ...this.state[k] }; });
    return snap;
  }

  _emit() {
    const snap = this._snapshot();
    this.listeners.forEach((fn) => { try { fn(snap); } catch {} });
  }

  _get(reciterId, surah) {
    return this.state[this.key(reciterId, surah)] || blankState();
  }

  isDownloaded(reciterId, surah) {
    return this._get(reciterId, surah).downloaded;
  }

  countDownloaded(reciterId) {
    const prefix = `${reciterId}:`;
    let n = 0;
    Object.keys(this.state).forEach((k) => {
      if (k.startsWith(prefix) && this.state[k].downloaded) n += 1;
    });
    return n;
  }

  isBulkActive(reciterId) {
    return !!this.bulk[reciterId];
  }

  async downloadAll(reciterId) {
    if (Platform.OS === 'web' || !reciterHasSurahAudio(reciterId) || this.bulk[reciterId]) return;
    this.bulk[reciterId] = true;
    this._emit();
    for (let surah = 1; surah <= SURAH_COUNT; surah += 1) {
      if (!this.bulk[reciterId]) break;
      if (this.isDownloaded(reciterId, surah)) continue;
      await this.start(reciterId, surah);
    }
    this.bulk[reciterId] = false;
    this._emit();
  }

  cancelAll(reciterId) {
    this.bulk[reciterId] = false;
    for (let surah = 1; surah <= SURAH_COUNT; surah += 1) this.cancel(reciterId, surah);
    this._emit();
  }

  _reciterName(reciterId) {
    const r = getReciter(reciterId);
    if (!r) return '';
    return isRTL() ? r.nameAr : r.nameEn;
  }

  _surahName(surah) {
    const s = surahsData.find((x) => x.id === surah);
    if (!s) return String(surah);
    return isRTL() ? s.nameAr : s.nameEn;
  }

  _notifId(reciterId, surah) {
    return `quran-download-${reciterId}-${surah}`;
  }

  async _ensurePermissionOnce() {
    if (this._permissionEnsured) return;
    this._permissionEnsured = true;
    await NotificationService.ensurePermission();
  }

  _notify(reciterId, surah, progress) {
    const pct = Math.round((progress || 0) * 100);
    showDownloadProgress(
      this._notifId(reciterId, surah),
      t('quran.offlineDownloadingTitle', { surah: this._surahName(surah) }),
      t('quran.offlineDownloadingBody', { reciter: this._reciterName(reciterId), pct })
    );
  }

  async _ensureDir(reciterId) {
    try {
      const info = await FileSystem.getInfoAsync(this._dir(reciterId));
      if (!info.exists) await FileSystem.makeDirectoryAsync(this._dir(reciterId), { intermediates: true });
    } catch {}
  }

  async checkInstalled(reciterId) {
    let names = [];
    try {
      const info = await FileSystem.getInfoAsync(this._dir(reciterId));
      if (info.exists) names = await FileSystem.readDirectoryAsync(this._dir(reciterId));
    } catch {}
    for (const name of names) {
      const m = /^(\d+)\.mp3$/.exec(name);
      if (!m) continue;
      const surah = parseInt(m[1], 10);
      try {
        const fi = await FileSystem.getInfoAsync(this._dir(reciterId) + name);
        if (fi.exists && fi.size > MIN_SIZE) {
          this.state[this.key(reciterId, surah)] = { downloaded: true, downloading: false, progress: 1, error: null, size: fi.size };
        }
      } catch {}
    }
    this.checked[reciterId] = true;
    this._emit();
  }

  async getLocalAudioUri(reciterId, surah) {
    if (Platform.OS === 'web') return null;
    const uri = this._localUri(reciterId, surah);
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && info.size > MIN_SIZE) return uri;
    } catch {}
    return null;
  }

  async start(reciterId, surah) {
    if (Platform.OS === 'web' || !reciterHasSurahAudio(reciterId)) return;
    const k = this.key(reciterId, surah);
    if (this.state[k] && (this.state[k].downloading || this.state[k].downloaded)) return;
    this.cancelled[k] = false;
    this.state[k] = { downloaded: false, downloading: true, progress: 0, error: null, size: 0 };
    this._emit();
    await this._ensureDir(reciterId);
    await this._ensurePermissionOnce();
    this._notifiedPct[k] = 0;
    this._notify(reciterId, surah, 0);

    try {
      const manifest = await getSurahAudioManifest(reciterId, surah);
      if (!manifest || !manifest.audioUrl) throw new Error('No audio source');
      if (this.cancelled[k]) { this.state[k] = blankState(); this._emit(); hideDownloadProgress(this._notifId(reciterId, surah)); return; }

      const dl = FileSystem.createDownloadResumable(
        manifest.audioUrl,
        this._localUri(reciterId, surah),
        {},
        (p) => {
          if (p.totalBytesExpectedToWrite > 0) {
            const progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
            this.state[k].progress = progress;
            this._emit();
            const pct = Math.round(progress * 100);
            if (pct !== this._notifiedPct[k]) {
              this._notifiedPct[k] = pct;
              this._notify(reciterId, surah, progress);
            }
          }
        }
      );
      const result = await dl.downloadAsync();

      if (this.cancelled[k]) {
        try { await FileSystem.deleteAsync(this._localUri(reciterId, surah), { idempotent: true }); } catch {}
        this.state[k] = blankState();
        this._emit();
        hideDownloadProgress(this._notifId(reciterId, surah));
        return;
      }
      if (!result || (result.status && result.status >= 400)) {
        throw new Error(`Download failed (status ${result && result.status})`);
      }

      let size = 0;
      try { size = (await FileSystem.getInfoAsync(this._localUri(reciterId, surah))).size || 0; } catch {}
      this.state[k] = { downloaded: true, downloading: false, progress: 1, error: null, size };
      this._emit();
      hideDownloadProgress(this._notifId(reciterId, surah));
    } catch (e) {
      try { await FileSystem.deleteAsync(this._localUri(reciterId, surah), { idempotent: true }); } catch {}
      this.state[k] = { downloaded: false, downloading: false, progress: 0, error: String(e && e.message ? e.message : e), size: 0 };
      this._emit();
      hideDownloadProgress(this._notifId(reciterId, surah));
    }
  }

  cancel(reciterId, surah) {
    const k = this.key(reciterId, surah);
    if (this.state[k] && this.state[k].downloading) {
      this.cancelled[k] = true;
      hideDownloadProgress(this._notifId(reciterId, surah));
    }
  }

  async remove(reciterId, surah) {
    const k = this.key(reciterId, surah);
    try { await FileSystem.deleteAsync(this._localUri(reciterId, surah), { idempotent: true }); } catch {}
    this.state[k] = blankState();
    this._emit();
  }
}

const instance = new QuranSurahDownloaderService();
export default instance;
