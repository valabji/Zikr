import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

const STORAGE_KEY = PRAYER_CONSTANTS.STORAGE_KEYS.CHECKIN;
export const MANDATORY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function dateKeyForOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function todayKey() {
  return dateKeyForOffset(0);
}

function dayComplete(day) {
  if (!day) return false;
  return MANDATORY_PRAYERS.every((p) => !!day[p]);
}

function computeStreak(days) {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    const key = `${cursor.getFullYear()}-${mm}-${dd}`;
    if (!dayComplete(days[key])) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computePrayerCheckInStats(state) {
  const days = (state && state.days) || {};
  const today = days[todayKey()] || {};
  const todayCount = MANDATORY_PRAYERS.filter((p) => !!today[p]).length;
  return {
    streak: computeStreak(days),
    todayCount,
    todayTotal: MANDATORY_PRAYERS.length,
    completedToday: todayCount === MANDATORY_PRAYERS.length,
    today,
  };
}

export function getCheckInHistory(state, numDays = 7) {
  const days = (state && state.days) || {};
  const history = [];
  for (let offsetDays = 0; offsetDays < numDays; offsetDays++) {
    const dateKey = dateKeyForOffset(offsetDays);
    const day = days[dateKey] || {};
    const count = MANDATORY_PRAYERS.filter((p) => !!day[p]).length;
    history.push({
      dateKey,
      offsetDays,
      day,
      count,
      total: MANDATORY_PRAYERS.length,
      complete: count === MANDATORY_PRAYERS.length,
    });
  }
  return history;
}

let cached = null;
let persistTimer = null;
let appStateListenerRegistered = false;
const listeners = new Set();

function seedState() {
  return { days: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return { days: raw.days && typeof raw.days === 'object' ? raw.days : {} };
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

export async function loadPrayerCheckIn() {
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

export function getCachedPrayerCheckIn() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribePrayerCheckIn(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function togglePrayerCheckIn(prayerName) {
  if (!MANDATORY_PRAYERS.includes(prayerName)) return;
  const state = getState();
  const today = todayKey();
  const day = { ...(state.days[today] || {}) };
  if (day[prayerName]) {
    delete day[prayerName];
  } else {
    day[prayerName] = Date.now();
  }
  commit({ ...state, days: { ...state.days, [today]: day } });
}

export function togglePrayerCheckInForDate(prayerName, dateKey) {
  if (!MANDATORY_PRAYERS.includes(prayerName)) return;
  const state = getState();
  const day = { ...(state.days[dateKey] || {}) };
  if (day[prayerName]) {
    delete day[prayerName];
  } else {
    day[prayerName] = Date.now();
  }
  commit({ ...state, days: { ...state.days, [dateKey]: day } });
}

export function usePrayerCheckIn() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadPrayerCheckIn().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribePrayerCheckIn((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computePrayerCheckInStats(state) };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
