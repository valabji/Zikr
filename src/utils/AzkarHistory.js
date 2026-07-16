import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';

const STORAGE_KEY = '@azkar_history';
export const MORNING_CATEGORY = 'أذكار الصباح';
export const EVENING_CATEGORY = 'أذكار المساء';

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function computeStreak(dates) {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    const key = `${cursor.getFullYear()}-${mm}-${dd}`;
    if (!dates[key]) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeAzkarStats(history) {
  const morning = (history && history.morning) || {};
  const evening = (history && history.evening) || {};
  const today = todayKey();
  return {
    morningStreak: computeStreak(morning),
    eveningStreak: computeStreak(evening),
    morningDoneToday: !!morning[today],
    eveningDoneToday: !!evening[today],
  };
}

let cached = null;
let persistTimer = null;
let appStateListenerRegistered = false;
const listeners = new Set();

function seedState() {
  return { morning: {}, evening: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return {
    morning: raw.morning && typeof raw.morning === 'object' ? raw.morning : {},
    evening: raw.evening && typeof raw.evening === 'object' ? raw.evening : {},
  };
}

function emit() {
  listeners.forEach((fn) => {
    try { fn(cached); } catch {}
  });
}

function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!cached) return;
  const snapshot = cached;
  try {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))?.catch?.(() => {});
  } catch {}
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushPersist();
  }, 500);
}

function registerAppStateListener() {
  if (appStateListenerRegistered) return;
  try {
    AppState?.addEventListener?.('change', (next) => {
      if (next === 'background' || next === 'inactive') flushPersist();
    });
    appStateListenerRegistered = true;
  } catch {}
}

function getState() {
  if (!cached) cached = seedState();
  return cached;
}

function commit(next) {
  cached = next;
  emit();
  schedulePersist();
}

export async function loadAzkarHistory() {
  registerAppStateListener();
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cached = raw ? normalizeState(JSON.parse(raw)) : seedState();
  } catch {
    cached = seedState();
  }
  return cached;
}

export function getCachedAzkarHistory() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribeAzkarHistory(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function logAzkarCompletion(category) {
  const key = category === MORNING_CATEGORY ? 'morning' : category === EVENING_CATEGORY ? 'evening' : null;
  if (!key) return;
  const state = getState();
  const today = todayKey();
  if (state[key][today]) return;
  commit({ ...state, [key]: { ...state[key], [today]: Date.now() } });
}

export function useAzkarHistory() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadAzkarHistory().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeAzkarHistory((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { history: state, stats: computeAzkarStats(state) };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
