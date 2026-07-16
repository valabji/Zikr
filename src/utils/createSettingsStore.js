import AsyncStorage from '@react-native-async-storage/async-storage';

export function createSettingsStore(storageKey, defaults) {
  let cached = null;
  const listeners = new Set();

  async function load() {
    if (cached) return cached;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      cached = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch {
      cached = { ...defaults };
    }
    return cached;
  }

  function getCached() {
    return cached || { ...defaults };
  }

  async function set(partial) {
    const current = await load();
    cached = { ...current, ...partial };
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(cached));
    } catch {}
    listeners.forEach((fn) => {
      try { fn(cached); } catch {}
    });
    return cached;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function _resetForTests() {
    cached = null;
    listeners.clear();
  }

  return { load, getCached, set, subscribe, _resetForTests };
}
