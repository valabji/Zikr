import AsyncStorage from '@react-native-async-storage/async-storage';

export function createSettingsStore(storageKey, defaults) {
  let cached = null;
  let loading = null;
  let writes = Promise.resolve();
  const listeners = new Set();

  async function load() {
    if (cached) return cached;
    if (!loading) {
      loading = (async () => {
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          const parsed = raw ? JSON.parse(raw) : null;
          cached = { ...defaults, ...(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}) };
        } catch {
          cached = { ...defaults };
        } finally {
          loading = null;
        }
        return cached;
      })();
    }
    return loading;
  }

  function getCached() {
    return cached || { ...defaults };
  }

  async function set(partial) {
    await load();
    cached = { ...cached, ...partial };
    const snapshot = cached;
    writes = writes.then(() => AsyncStorage.setItem(storageKey, JSON.stringify(snapshot))).catch(() => {});
    await writes;
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
