import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOOKS_CONSTANTS } from '@/constants/BooksConstants';
import { transformRawBook } from './booksTransform';

const { SOURCE, LOCAL_DIR, STORAGE_KEYS, DATA_VERSION } = BOOKS_CONSTANTS;
const VERSION_TAG = String(DATA_VERSION);

const localDir = FileSystem.documentDirectory + LOCAL_DIR;

export function bookFileUri(id) {
  return `${localDir}${id}.json`;
}

function tmpUri(id) {
  return `${localDir}${id}.src`;
}

function remoteUrl(src) {
  return `${SOURCE.RAW_BASE}/${src}`;
}

function installedKey(id) {
  return `${STORAGE_KEYS.INSTALLED_PREFIX}${id}`;
}

function blank() {
  return { installed: false, downloading: false, progress: 0, error: null };
}

class BooksDownloaderService {
  constructor() {
    this.state = {};
    this.listeners = new Set();
    this.handles = {};
    this.cancelled = {};
  }

  _get(id) {
    if (!this.state[id]) this.state[id] = blank();
    return this.state[id];
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this._snapshot());
    return () => this.listeners.delete(fn);
  }

  _snapshot() {
    const snap = {};
    for (const id of Object.keys(this.state)) snap[id] = { ...this.state[id] };
    return snap;
  }

  _emit() {
    const snap = this._snapshot();
    this.listeners.forEach((fn) => { try { fn(snap); } catch {} });
  }

  isInstalled(id) {
    return !!(this.state[id] && this.state[id].installed);
  }

  async checkInstalled(ids) {
    for (const id of ids) {
      try {
        const tag = await AsyncStorage.getItem(installedKey(id));
        if (tag === VERSION_TAG) {
          this._get(id).installed = true;
        } else if (tag != null) {
          try { await FileSystem.deleteAsync(bookFileUri(id), { idempotent: true }); } catch {}
          await AsyncStorage.removeItem(installedKey(id));
        }
      } catch {}
    }
    this._emit();
  }

  async _ensureDir() {
    try {
      const info = await FileSystem.getInfoAsync(localDir);
      if (!info.exists) await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
    } catch {}
  }

  async start(book) {
    if (!book || !book.src || Platform.OS === 'web') return;
    const id = book.id;
    const s = this._get(id);
    if (s.downloading || s.installed) return;
    this.cancelled[id] = false;
    this.state[id] = { installed: false, downloading: true, progress: 0, error: null };
    this._emit();
    await this._ensureDir();
    const tmp = tmpUri(id);
    try {
      let lastEmit = 0;
      const onProgress = (p) => {
        const total = p.totalBytesExpectedToWrite || 0;
        const written = p.totalBytesWritten || 0;
        const ratio = total > 0 ? written / total : 0;
        this.state[id].progress = ratio;
        if (ratio - lastEmit >= 0.02 || ratio === 1) { lastEmit = ratio; this._emit(); }
      };
      const handle = FileSystem.createDownloadResumable(remoteUrl(book.src), tmp, {}, onProgress);
      this.handles[id] = handle;
      await handle.downloadAsync();
      if (this.cancelled[id]) { await this._cleanup(id); return; }

      const rawStr = await FileSystem.readAsStringAsync(tmp);
      const transformed = transformRawBook(JSON.parse(rawStr));
      if (!transformed.entries.length) throw new Error('empty book');
      await FileSystem.writeAsStringAsync(bookFileUri(id), JSON.stringify({ id, format: DATA_VERSION, ...transformed }));
      try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}
      await AsyncStorage.setItem(installedKey(id), VERSION_TAG);
      this.state[id] = { installed: true, downloading: false, progress: 1, error: null };
      delete this.handles[id];
      this._emit();
    } catch (e) {
      try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}
      delete this.handles[id];
      this.state[id] = { installed: false, downloading: false, progress: 0, error: String(e && e.message ? e.message : e) };
      this._emit();
    }
  }

  async startAll(books) {
    for (const book of books || []) {
      if (!book || !book.src) continue;
      const s = this._get(book.id);
      if (s.installed || s.downloading) continue;
      await this.start(book);
    }
  }

  async _cleanup(id) {
    try { await FileSystem.deleteAsync(tmpUri(id), { idempotent: true }); } catch {}
    delete this.handles[id];
    this.state[id] = blank();
    this._emit();
  }

  cancel(id) {
    if (!this.state[id] || !this.state[id].downloading) return;
    this.cancelled[id] = true;
    const handle = this.handles[id];
    if (handle && handle.cancelAsync) { handle.cancelAsync().catch(() => {}); }
  }

  async uninstall(id) {
    try { await FileSystem.deleteAsync(bookFileUri(id), { idempotent: true }); } catch {}
    await AsyncStorage.removeItem(installedKey(id));
    this.state[id] = blank();
    this._emit();
  }
}

const instance = new BooksDownloaderService();
export default instance;
