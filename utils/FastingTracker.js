import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import { ISLAMIC_CALENDAR_CONSTANTS } from '../constants/IslamicCalendarConstants';
import { dateKey, isWithinRamadan, getRamadanRange, toHijri } from './HijriCalendar';

const STORAGE_KEY = ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.FASTING_TRACKER;

function seedState() {
  return { days: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return { days: raw.days && typeof raw.days === 'object' ? raw.days : {} };
}

let cached = null;
let persistTimer = null;
let appStateListenerRegistered = false;
const listeners = new Set();

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

export async function loadFastingTracker() {
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

export function getCachedFastingTracker() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribeFastingTracker(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isFastDay(key) {
  return !!getState().days[key];
}

export function toggleFastDay(key) {
  const state = getState();
  const days = { ...state.days };
  if (days[key]) {
    delete days[key];
  } else {
    days[key] = Date.now();
  }
  commit({ ...state, days });
  return !!days[key];
}

export function computeFastingStats(state, fromDate = new Date()) {
  const days = (state && state.days) || {};
  const totalFasts = Object.keys(days).length;
  const inRamadan = isWithinRamadan(fromDate);
  let ramadanFasted = 0;
  let ramadanTotal = 0;

  if (inRamadan) {
    const hijri = toHijri(fromDate);
    const range = getRamadanRange(hijri.iYear);
    ramadanTotal = range.daysInMonth;
    const cursor = new Date(range.start);
    for (let i = 0; i < range.daysInMonth; i++) {
      if (days[dateKey(cursor)]) ramadanFasted++;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { totalFasts, ramadanFasted, ramadanTotal, inRamadan };
}

export function useFastingTracker() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadFastingTracker().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeFastingTracker((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeFastingStats(state) };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
