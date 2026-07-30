import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOOKS_CONSTANTS } from '../constants/BooksConstants';

const { STORAGE_KEYS, DEFAULT_SETTINGS } = BOOKS_CONSTANTS;

let cached = null;
const listeners = new Set();

export async function loadBooksSettings() {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    cached = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  return cached;
}

export function getCachedBooksSettings() {
  return cached || { ...DEFAULT_SETTINGS };
}

export async function setBooksSettings(partial) {
  const current = await loadBooksSettings();
  cached = { ...current, ...partial };
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cached));
  } catch {}
  listeners.forEach((fn) => {
    try { fn(cached); } catch {}
  });
  return cached;
}

export function subscribeBooksSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function _resetForTests() {
  cached = null;
  listeners.clear();
}
