import * as FileSystem from 'expo-file-system/legacy';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL = 604;
const REMOTE_BASE = 'https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/v1/ttf';
const LOCAL_DIR = FileSystem.documentDirectory + 'quran/fonts/v1/';
const INSTALLED_KEY = '@quran_qcf_installed';

function fileName(page) { return `p${page}.ttf`; }
function localUri(page) { return LOCAL_DIR + fileName(page); }
function remoteUrl(page) { return `${REMOTE_BASE}/p${page}.ttf`; }
function fontFamily(page) { return `QCF_P${String(page).padStart(3, '0')}`; }

class QcfDownloaderService {
  constructor() {
    this.state = { installed: false, downloading: false, progress: 0, error: null };
    this.listeners = new Set();
    this.cancelled = false;
    this.registeredFonts = false;
  }

  async checkInstalled() {
    try {
      const flag = await AsyncStorage.getItem(INSTALLED_KEY);
      if (flag === '1') {
        this.state.installed = true;
        this._emit();
        await this._registerFonts();
      }
    } catch {}
    return this.state.installed;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  _emit() {
    const snap = { ...this.state };
    this.listeners.forEach((fn) => { try { fn(snap); } catch {} });
  }

  async _ensureDir() {
    try {
      const info = await FileSystem.getInfoAsync(LOCAL_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(LOCAL_DIR, { intermediates: true });
      }
    } catch {}
  }

  async start() {
    if (this.state.downloading || this.state.installed) return;
    this.cancelled = false;
    this.state.downloading = true;
    this.state.progress = 0;
    this.state.error = null;
    this._emit();
    await this._ensureDir();

    try {
      let done = 0;
      const CONCURRENCY = 6;
      const queue = [];
      for (let p = 1; p <= TOTAL; p++) queue.push(p);

      const worker = async () => {
        while (queue.length && !this.cancelled) {
          const page = queue.shift();
          const dest = localUri(page);
          try {
            const info = await FileSystem.getInfoAsync(dest);
            if (!info.exists || info.size < 1000) {
              await FileSystem.downloadAsync(remoteUrl(page), dest);
            }
          } catch (e) {
            console.warn(`QcfDownloader: page ${page} failed`, e);
            throw e;
          }
          done++;
          this.state.progress = done / TOTAL;
          if (done % 10 === 0) this._emit();
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      if (this.cancelled) {
        this.state.downloading = false;
        this.state.progress = 0;
        this._emit();
        return;
      }

      await AsyncStorage.setItem(INSTALLED_KEY, '1');
      this.state.installed = true;
      this.state.downloading = false;
      this.state.progress = 1;
      this._emit();
      await this._registerFonts();
    } catch (e) {
      this.state.downloading = false;
      this.state.error = String(e && e.message ? e.message : e);
      this._emit();
      throw e;
    }
  }

  cancel() {
    if (this.state.downloading) this.cancelled = true;
  }

  async uninstall() {
    try {
      await FileSystem.deleteAsync(LOCAL_DIR, { idempotent: true });
    } catch {}
    await AsyncStorage.removeItem(INSTALLED_KEY);
    this.state = { installed: false, downloading: false, progress: 0, error: null };
    this.registeredFonts = false;
    this._emit();
  }

  async _registerFonts() {
    if (this.registeredFonts) return;
    try {
      const fontMap = {};
      for (let p = 1; p <= TOTAL; p++) {
        fontMap[fontFamily(p)] = localUri(p);
      }
      await Font.loadAsync(fontMap);
      this.registeredFonts = true;
    } catch (e) {
      console.warn('QcfDownloader: font registration failed', e);
    }
  }

  fontFamilyForPage(page) {
    return fontFamily(page);
  }
}

const instance = new QcfDownloaderService();
export default instance;
export { fontFamily as qcfFontFamilyForPage };
