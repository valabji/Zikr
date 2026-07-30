import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIO_CONSTANTS } from '../constants/RadioConstants';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

let cached = null;
const listeners = new Set();

export async function loadRadioFavorites() {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    const parsed = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed) ? parsed : [];
  } catch {
    cached = [];
  }
  return cached;
}

export function getCachedRadioFavorites() {
  return cached || [];
}

export function isRadioFavorite(id) {
  return (cached || []).includes(id);
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(cached));
  } catch {}
  listeners.forEach((fn) => {
    try { fn(cached); } catch {}
  });
}

export async function toggleRadioFavorite(id) {
  const current = await loadRadioFavorites();
  cached = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  await persist();
  return cached;
}

export function subscribeRadioFavorites(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function _resetForTests() {
  cached = null;
  listeners.clear();
}
