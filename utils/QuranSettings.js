import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';

const { STORAGE_KEYS, DEFAULT_SETTINGS } = QURAN_CONSTANTS;

let cached = null;
const listeners = new Set();

export async function loadQuranSettings() {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    cached = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  return cached;
}

export function getCachedQuranSettings() {
  return cached || { ...DEFAULT_SETTINGS };
}

export async function setQuranSettings(partial) {
  const current = await loadQuranSettings();
  cached = { ...current, ...partial };
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cached));
  } catch {}
  listeners.forEach((fn) => {
    try { fn(cached); } catch {}
  });
  return cached;
}

export function subscribeQuranSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
