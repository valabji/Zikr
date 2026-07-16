import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { ADHAN_CATALOG } from '@/constants/AdhanCatalog';

const DIR = FileSystem.documentDirectory + 'adhans/';

function localUri(id) {
  return `${DIR}${id}.mp3`;
}

function blankState() {
  return { downloaded: false, downloading: false, progress: 0, error: null };
}

class AdhanDownloaderService {
  constructor() {
    this.state = {};
    ADHAN_CATALOG.forEach((a) => {
      if (!a.bundled) this.state[a.id] = blankState();
    });
    this.listeners = new Set();
    this.cancelled = {};
  }

  async checkInstalled() {
    for (const a of ADHAN_CATALOG) {
      if (a.bundled) continue;
      try {
        const info = await FileSystem.getInfoAsync(localUri(a.id));
        this.state[a.id].downloaded = !!(info.exists && info.size > 1000);
      } catch {}
    }
    this._emit();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this._snapshot());
    return () => this.listeners.delete(fn);
  }

  _snapshot() {
    const snap = {};
    Object.keys(this.state).forEach((id) => { snap[id] = { ...this.state[id] }; });
    return snap;
  }

  _emit() {
    const snap = this._snapshot();
    this.listeners.forEach((fn) => { try { fn(snap); } catch {} });
  }

  async _ensureDir() {
    try {
      const info = await FileSystem.getInfoAsync(DIR);
      if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    } catch {}
  }

  isDownloaded(id) {
    return !!(this.state[id] && this.state[id].downloaded);
  }

  async getPlayableUri(id) {
    if (!this.state[id]) return null;
    try {
      const info = await FileSystem.getInfoAsync(localUri(id));
      if (info.exists && info.size > 1000) return localUri(id);
    } catch {}
    return null;
  }

  async start(id) {
    const entry = ADHAN_CATALOG.find((a) => a.id === id);
    if (!entry || entry.bundled || !entry.url || Platform.OS === 'web') return;
    if (this.state[id].downloading || this.state[id].downloaded) return;
    this.cancelled[id] = false;
    this.state[id] = { downloaded: false, downloading: true, progress: 0, error: null };
    this._emit();
    await this._ensureDir();

    try {
      const dl = FileSystem.createDownloadResumable(
        entry.url,
        localUri(id),
        {},
        (p) => {
          if (p.totalBytesExpectedToWrite > 0) {
            this.state[id].progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
            this._emit();
          }
        }
      );
      const result = await dl.downloadAsync();

      if (this.cancelled[id]) {
        try { await FileSystem.deleteAsync(localUri(id), { idempotent: true }); } catch {}
        this.state[id] = blankState();
        this._emit();
        return;
      }

      if (!result || (result.status && result.status >= 400)) {
        throw new Error(`Download failed (status ${result && result.status})`);
      }

      this.state[id] = { downloaded: true, downloading: false, progress: 1, error: null };
      this._emit();
    } catch (e) {
      try { await FileSystem.deleteAsync(localUri(id), { idempotent: true }); } catch {}
      this.state[id] = {
        downloaded: false, downloading: false, progress: 0,
        error: String(e && e.message ? e.message : e),
      };
      this._emit();
    }
  }

  cancel(id) {
    if (this.state[id] && this.state[id].downloading) this.cancelled[id] = true;
  }

  async remove(id) {
    if (!this.state[id]) return;
    try { await FileSystem.deleteAsync(localUri(id), { idempotent: true }); } catch {}
    this.state[id] = blankState();
    this._emit();
  }
}

const instance = new AdhanDownloaderService();
export default instance;
export { localUri as adhanLocalUri };
