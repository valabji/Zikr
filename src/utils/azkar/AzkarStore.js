import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_KEYS } from '@/constants/StorageKeys';
import defaultAzkar from '@/constants/Azkar.json';

let cached = defaultAzkar;
const listeners = new Set();

export async function loadAzkar() {
  try {
    const raw = await AsyncStorage.getItem(APP_KEYS.ZIKR);
    cached = raw ? JSON.parse(raw) : defaultAzkar;
  } catch {
    cached = defaultAzkar;
  }
  return cached;
}

export function getAzkar() {
  return cached;
}

export function setAzkar(list) {
  cached = list;
  listeners.forEach((fn) => {
    try { fn(cached); } catch {}
  });
  try {
    AsyncStorage.setItem(APP_KEYS.ZIKR, JSON.stringify(list))?.catch?.(() => {});
  } catch {}
}

export function subscribeAzkar(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
