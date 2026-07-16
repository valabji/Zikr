import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base64ToBytes, bytesToBase64, patchQcf4Dark } from './qcf4Dark';

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
  v4: {
    remoteBase: 'https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/v4/colrv1/ttf',
    localDir: FileSystem.documentDirectory + 'quran/fonts/v4/',
    fontFamilyPrefix: 'QCF4_P',
    darkFontFamilyPrefix: 'QCF4D_P',
    installedKey: '@quran_qcf_v4_installed',
    optOutKey: '@quran_qcf_v4_auto_opt_out',
  },
};

function fontFamily(version, page, dark) {
  const v = VERSIONS[version];
  const prefix = dark && v.darkFontFamilyPrefix ? v.darkFontFamilyPrefix : v.fontFamilyPrefix;
  return `${prefix}${String(page).padStart(3, '0')}`;
}

function localUri(version, page, dark) {
  return `${VERSIONS[version].localDir}p${page}${dark ? 'd' : ''}.ttf`;
}

function remoteUrl(version, page) {
  return `${VERSIONS[version].remoteBase}/p${page}.ttf`;
}

function blankVersionState() {
  return { installed: false, downloading: false, progress: 0, error: null };
}

class QcfDownloaderService {
  constructor() {
    this.state = {};
    this.cancelled = {};
    for (const v of Object.keys(VERSIONS)) {
      this.state[v] = blankVersionState();
      this.cancelled[v] = false;
    }
    this.listeners = new Set();
  }

  async checkInstalled() {
    for (const v of Object.keys(VERSIONS)) {
      try {
        const flag = await AsyncStorage.getItem(VERSIONS[v].installedKey);
        if (flag === '1') this.state[v].installed = true;
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
    for (const v of Object.keys(VERSIONS)) snap[v] = { ...this.state[v] };
    return snap;
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
      const units = v.darkFontFamilyPrefix ? TOTAL * 2 : TOTAL;
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
          this.state[version].progress = done / units;
          if (done % 10 === 0) this._emit();
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      if (v.darkFontFamilyPrefix) {
        for (let page = 1; page <= TOTAL && !this.cancelled[version]; page++) {
          const dest = localUri(version, page, true);
          const info = await FileSystem.getInfoAsync(dest);
          if (!info.exists || info.size < 1000) {
            const b64 = await FileSystem.readAsStringAsync(localUri(version, page), { encoding: FileSystem.EncodingType.Base64 });
            const bytes = patchQcf4Dark(base64ToBytes(b64));
            await FileSystem.writeAsStringAsync(dest, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 });
          }
          done++;
          this.state[version].progress = done / units;
          if (done % 10 === 0) this._emit();
        }
      }

      if (this.cancelled[version]) {
        this.state[version] = { ...blankVersionState() };
        this._emit();
        return;
      }

      await AsyncStorage.setItem(v.installedKey, '1');
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
    this._emit();
  }

  // Fonts load per page on demand: bulk-registering all 604+ pages at once can
  // silently register Typeface.DEFAULT on Android under memory pressure.
  async loadPageFont(version, page, dark) {
    const family = fontFamily(version, page, dark);
    if (!Font.isLoaded(family)) {
      await Font.loadAsync({ [family]: localUri(version, page, dark) });
    }
    return family;
  }

  isInstalled(version) {
    return !!(this.state[version] && this.state[version].installed);
  }
}

const instance = new QcfDownloaderService();
export default instance;
export { fontFamily as qcfFontFamilyForPage };
