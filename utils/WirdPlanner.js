import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import { WIRD_CONSTANTS } from '../constants/WirdConstants';

const STORAGE_KEY = WIRD_CONSTANTS.STORAGE_KEYS.PLAN;

function todayKey(fromDate = new Date()) {
  const d = fromDate;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function seedState() {
  return { dailyTargetPages: 0, log: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return {
    dailyTargetPages: Number.isFinite(raw.dailyTargetPages) ? raw.dailyTargetPages : 0,
    log: raw.log && typeof raw.log === 'object' ? raw.log : {},
  };
}

function computeStreak(log, dailyTargetPages, fromDate) {
  if (!dailyTargetPages || dailyTargetPages <= 0) return 0;
  let streak = 0;
  const cursor = new Date(fromDate);
  while (true) {
    const key = todayKey(cursor);
    if ((log[key] || 0) < dailyTargetPages) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeWirdStats(state, fromDate = new Date()) {
  const dailyTargetPages = (state && state.dailyTargetPages) || 0;
  const log = (state && state.log) || {};
  const totalPagesRead = Object.values(log).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const khatmahCount = Math.floor(totalPagesRead / WIRD_CONSTANTS.TOTAL_QURAN_PAGES);
  const currentKhatmahProgress = totalPagesRead % WIRD_CONSTANTS.TOTAL_QURAN_PAGES;
  const todayPages = log[todayKey(fromDate)] || 0;

  return {
    dailyTargetPages,
    totalPagesRead,
    khatmahCount,
    currentKhatmahProgress,
    todayPages,
    todayTargetMet: dailyTargetPages > 0 && todayPages >= dailyTargetPages,
    streak: computeStreak(log, dailyTargetPages, fromDate),
  };
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

export async function loadWirdPlanner() {
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

export function getCachedWirdPlanner() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribeWirdPlanner(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setDailyTargetPages(pages) {
  const state = getState();
  const dailyTargetPages = Math.max(0, Number(pages) || 0);
  commit({ ...state, dailyTargetPages });
}

export function logPagesToday(pages) {
  const state = getState();
  const key = todayKey();
  const current = state.log[key] || 0;
  const next = Math.max(0, current + (Number(pages) || 0));
  commit({ ...state, log: { ...state.log, [key]: next } });
}

export function resetKhatmah() {
  const state = getState();
  commit({ ...state, log: {} });
}

export function useWirdPlanner() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadWirdPlanner().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeWirdPlanner((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeWirdStats(state) };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
