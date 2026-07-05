import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledStations from '../assets/radio/stations.json';
import { RADIO_CONSTANTS } from '../constants/RadioConstants';

const { API_BASE, CACHE_TTL_MS, STORAGE_KEYS } = RADIO_CONSTANTS;

const apiLang = (lang) => (lang === 'ar' ? 'ar' : 'eng');

const RIWAYAT = [
  { keys: ['mojawwad', 'mujawwad'], type: 'recitation', en: 'Mujawwad', ar: 'مجوّدة' },
  { keys: ['murattal'], type: 'recitation', en: 'Murattal', ar: 'مرتّلة' },
  { keys: ['warsh'], type: 'riwayah', en: 'Warsh', ar: 'ورش' },
  { keys: ['qalon', 'qaloon', 'qalun'], type: 'riwayah', en: 'Qalon', ar: 'قالون' },
  { keys: ['khalaf'], type: 'riwayah', en: 'Khalaf', ar: 'خلف' },
  { keys: ['shubah', 'shuba'], type: 'riwayah', en: "Shu'bah", ar: 'شعبة' },
  { keys: ['assosi', 'alsosi', 'alsoosi', 'soosi', 'susi', 'sosi'], type: 'riwayah', en: 'Al-Soosi', ar: 'السوسي' },
  { keys: ['aldori', 'aldorai', 'aldouri', 'douri', 'dori', 'duri'], type: 'riwayah', en: 'Al-Douri', ar: 'الدوري' },
  { keys: ['albizi', 'albazzi', 'albazi', 'bizzi', 'bazzi'], type: 'riwayah', en: 'Al-Bazzi', ar: 'البزّي' },
  { keys: ['thakwan', 'dhakwan'], type: 'riwayah', en: 'Ibn Dhakwan', ar: 'ابن ذكوان' },
  { keys: ['alasbahani', 'asbahani'], type: 'riwayah', en: 'Al-Asbahani', ar: 'الأصبهاني' },
  { keys: ['qasr'], type: 'riwayah', en: 'Qasr', ar: 'قصر' },
  { keys: ['qunbul'], type: 'riwayah', en: 'Qunbul', ar: 'قنبل' },
];

export function getStationSubtitle(streamUrl, lang) {
  if (!streamUrl) return '';
  const slug = String(streamUrl).split('?')[0].replace(/\/+$/, '').split('/').pop().trim().toLowerCase();
  if (!slug) return '';
  const ar = lang === 'ar';
  const tokens = new Set(slug.split('_').filter(Boolean));
  for (const r of RIWAYAT) {
    if (!r.keys.some((k) => tokens.has(k))) continue;
    if (r.type === 'recitation') return ar ? `تلاوة ${r.ar}` : `${r.en} recitation`;
    return ar ? `رواية ${r.ar}` : `${r.en} narration`;
  }
  return '';
}

export function getBundledStations(lang) {
  const useAr = lang === 'ar';
  return bundledStations.map((s) => ({
    id: s.id,
    name: useAr ? s.nameAr : s.nameEn,
    streamUrl: s.streamUrl,
  }));
}

function mapApiRadios(radios) {
  if (!Array.isArray(radios)) return [];
  return radios
    .filter((r) => r && r.url)
    .map((r) => ({ id: r.id, name: (r.name || '').trim(), streamUrl: r.url }));
}

async function readCacheEntry(lang) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CACHE);
    if (!raw) return null;
    const entry = JSON.parse(raw)?.[apiLang(lang)];
    if (!entry || !Array.isArray(entry.stations) || entry.stations.length === 0) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCacheEntry(lang, stations, timestamp) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CACHE);
    const map = raw ? JSON.parse(raw) : {};
    map[apiLang(lang)] = { stations, timestamp };
    await AsyncStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(map));
  } catch {}
}

export function isCacheFresh(entry, now) {
  return !!entry && typeof entry.timestamp === 'number' && now - entry.timestamp < CACHE_TTL_MS;
}

export async function fetchStations(lang, { now } = {}) {
  const ts = typeof now === 'number' ? now : Date.now();
  try {
    const res = await fetch(`${API_BASE}/radios?language=${apiLang(lang)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const stations = mapApiRadios(json?.radios);
    if (stations.length === 0) throw new Error('empty stations');
    await writeCacheEntry(lang, stations, ts);
    return stations;
  } catch {
    const cached = await readCacheEntry(lang);
    if (cached?.stations?.length) return cached.stations;
    return getBundledStations(lang);
  }
}

export async function getStations(lang, { now } = {}) {
  const ts = typeof now === 'number' ? now : Date.now();
  const cached = await readCacheEntry(lang);
  if (isCacheFresh(cached, ts)) return cached.stations;
  return fetchStations(lang, { now: ts });
}

const OFFLINE_TTL_MS = 60 * 60 * 1000;
const offlineCache = {};

export async function checkStationOnline(streamUrl, { timeoutMs = 8000 } = {}) {
  if (!streamUrl) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(streamUrl, { method: 'GET', signal: controller.signal });
    controller.abort();
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function getOfflineStations(lang, stations, { now, onOffline, force, concurrency = 4, timeoutMs = 8000 } = {}) {
  const ts = typeof now === 'number' ? now : Date.now();
  const key = apiLang(lang);
  const cached = offlineCache[key];
  if (!force && cached && ts - cached.timestamp < OFFLINE_TTL_MS) return new Set(cached.offline);

  const list = Array.isArray(stations) ? stations : [];
  const offline = new Set();
  let cursor = 0;
  const worker = async () => {
    while (cursor < list.length) {
      const station = list[cursor++];
      const online = await checkStationOnline(station.streamUrl, { timeoutMs });
      if (!online) {
        offline.add(station.id);
        if (onOffline) onOffline(station.id);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, () => worker()));
  offlineCache[key] = { offline: new Set(offline), timestamp: ts };
  return offline;
}
