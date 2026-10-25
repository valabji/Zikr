import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Keep synchronous UI updates, but replay early edits over the saved state before
// persisting. A provisional snapshot must never count as a completed disk read.
export function createProgressStore(storageKey, seedState, normalizeState) {
  let cached = null;
  let initial = null;
  let loaded = false;
  let loading = null;
  let pending = [];
  let timer = null;
  let writing = null;
  let appStateSubscription = null;
  let generation = 0;
  const listeners = new Set();

  function seed() {
    if (!initial) initial = seedState();
    return initial;
  }

  function getCached() {
    if (!cached) cached = seed();
    return cached;
  }

  function emit() {
    listeners.forEach(fn => { try { fn(getCached()); } catch {} });
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!loaded || !cached) return;
    const snapshot = JSON.stringify(cached);
    const write = () => AsyncStorage.setItem(storageKey, snapshot);
    // Start the first write immediately when the app goes into the background.
    try {
      const next = Promise.resolve(writing ? writing.then(write) : write()).catch(() => {});
      writing = next;
      next.then(() => { if (writing === next) writing = null; });
    } catch {}
  }

  function schedulePersist() {
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }

  function load() {
    if (!appStateSubscription) {
      appStateSubscription = AppState?.addEventListener?.('change', next => {
        if (next === 'background' || next === 'inactive') flush();
      });
    }
    if (loaded) return Promise.resolve(cached);
    if (!loading) {
      const currentGeneration = generation;
      loading = (async () => {
        let state;
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          state = raw ? normalizeState(JSON.parse(raw)) : seed();
        } catch { state = seed(); }
        if (currentGeneration !== generation) return state;
        const hasEdits = pending.length > 0;
        for (const update of pending) state = update(state);
        pending = [];
        cached = state;
        loaded = true;
        loading = null;
        emit();
        if (hasEdits) schedulePersist();
        return cached;
      })();
    }
    return loading;
  }

  function update(reducer) {
    cached = reducer(getCached());
    if (!loaded) {
      pending.push(reducer);
      load();
    } else {
      schedulePersist();
    }
    emit();
    return cached;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function reset() {
    generation++;
    clearTimeout(timer);
    appStateSubscription?.remove?.();
    appStateSubscription = null;
    cached = null;
    initial = null;
    loaded = false;
    loading = null;
    pending = [];
    timer = null;
    listeners.clear();
  }

  return { load, getCached, update, subscribe, reset };
}
