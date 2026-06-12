import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL = 604;

const VERSIONS = {
  v1: {
    remoteBase: 'https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/v1/ttf',
    localDir: FileSystem.documentDirectory + 'quran/fonts/v1/',
    fontFamilyPrefix: 'QCF_P',
    installedKey: '@quran_qcf_v1_installed',
    optOutKey: '@quran_qcf_v1_auto_opt_out',
  },
  v2: {
    remoteBase: 'https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/v2/ttf',
    localDir: FileSystem.documentDirectory + 'quran/fonts/v2/',
    fontFamilyPrefix: 'QCFv2_P',
    installedKey: '@quran_qcf_v2_installed',
    optOutKey: '@quran_qcf_v2_auto_opt_out',
  },
};

function fontFamily(version, page) {
  return `${VERSIONS[version].fontFamilyPrefix}${String(page).padStart(3, '0')}`;
}

function localUri(version, page) {
  return `${VERSIONS[version].localDir}p${page}.ttf`;
}

function remoteUrl(version, page) {
  return `${VERSIONS[version].remoteBase}/p${page}.ttf`;
}

function blankVersionState() {
  return { installed: false, downloading: false, progress: 0, error: null };
}

class QcfDownloaderService {
  constructor() {
    this.state = { v1: blankVersionState(), v2: blankVersionState() };
    this.listeners = new Set();
    this.cancelled = { v1: false, v2: false };
    this.registered = { v1: false, v2: false };
  }

  async checkInstalled() {
    for (const v of Object.keys(VERSIONS)) {
      try {
        const flag = await AsyncStorage.getItem(VERSIONS[v].installedKey);
        if (flag === '1') {
          // Register first: installed must never be visible while fonts are still loading.
          await this._registerFonts(v);
          this.state[v].installed = true;
        }
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
    return {
      v1: { ...this.state.v1 },
      v2: { ...this.state.v2 },
    };
  }

  _emit() {
    const snap = this._snapshot();
    this.listeners.forEach((fn) => { try { fn(snap); } catch {} });
  }

  async _ensureDir(version) {
    try {
      const info = await FileSystem.getInfoAsync(VERSIONS[version].localDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(VERSIONS[version].localDir, { intermediates: true });
      }
    } catch {}
  }

  // Boot-time auto-install: starts (or resumes) the download unless the user
  // explicitly uninstalled this version from settings. Native only.
  async autoInstall(version) {
    const v = VERSIONS[version];
    if (!v || Platform.OS === 'web') return;
    if (this.state[version].downloading || this.state[version].installed) return;
    try {
      const optedOut = await AsyncStorage.getItem(v.optOutKey);
      if (optedOut === '1') return;
    } catch {}
    await this.start(version);
  }

  async start(version) {
    const v = VERSIONS[version];
    if (!v) return;
    if (this.state[version].downloading || this.state[version].installed) return;
    AsyncStorage.removeItem(v.optOutKey).catch(() => {});
    this.cancelled[version] = false;
    this.state[version] = { installed: false, downloading: true, progress: 0, error: null };
    this._emit();
    await this._ensureDir(version);

    try {
      let done = 0;
      const CONCURRENCY = 6;
      const queue = [];
      for (let p = 1; p <= TOTAL; p++) queue.push(p);

      const worker = async () => {
        while (queue.length && !this.cancelled[version]) {
          const page = queue.shift();
          const dest = localUri(version, page);
          try {
            const info = await FileSystem.getInfoAsync(dest);
            if (!info.exists || info.size < 1000) {
              await FileSystem.downloadAsync(remoteUrl(version, page), dest);
            }
          } catch (e) {
            console.warn(`QcfDownloader[${version}]: page ${page} failed`, e);
            throw e;
          }
          done++;
          this.state[version].progress = done / TOTAL;
          if (done % 10 === 0) this._emit();
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      if (this.cancelled[version]) {
        this.state[version] = { ...blankVersionState() };
        this._emit();
        return;
      }

      await AsyncStorage.setItem(v.installedKey, '1');
      // Register before announcing installed so pages never measure with a fallback font.
      await this._registerFonts(version);
      this.state[version] = { installed: true, downloading: false, progress: 1, error: null };
      this._emit();
    } catch (e) {
      this.state[version] = {
        installed: false, downloading: false, progress: 0,
        error: String(e && e.message ? e.message : e),
      };
      this._emit();
      throw e;
    }
  }

  cancel(version) {
    if (this.state[version] && this.state[version].downloading) {
      this.cancelled[version] = true;
    }
  }

  async uninstall(version) {
    const v = VERSIONS[version];
    if (!v) return;
    try { await FileSystem.deleteAsync(v.localDir, { idempotent: true }); } catch {}
    await AsyncStorage.removeItem(v.installedKey);
    AsyncStorage.setItem(v.optOutKey, '1').catch(() => {});
    this.state[version] = blankVersionState();
    this.registered[version] = false;
    this._emit();
  }

  async _registerFonts(version) {
    if (this.registered[version]) return;
    try {
      const fontMap = {};
      for (let p = 1; p <= TOTAL; p++) {
        fontMap[fontFamily(version, p)] = localUri(version, p);
      }
      await Font.loadAsync(fontMap);
      this.registered[version] = true;
    } catch (e) {
      console.warn(`QcfDownloader[${version}]: font registration failed`, e);
    }
  }

  fontFamilyForPage(version, page) {
    return fontFamily(version, page);
  }

  isInstalled(version) {
    return !!(this.state[version] && this.state[version].installed);
  }
}

const instance = new QcfDownloaderService();
export default instance;
export { fontFamily as qcfFontFamilyForPage };
