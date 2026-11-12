import { createProgressStore } from '@/utils/createProgressStore';
import { useState, useEffect } from 'react';
import { WIRD_CONSTANTS } from '@/constants/WirdConstants';

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
  const log = {};
  if (raw.log && typeof raw.log === 'object' && !Array.isArray(raw.log)) {
    Object.entries(raw.log).forEach(([day, pages]) => {
      if (Number.isFinite(pages) && pages >= 0) log[day] = Math.floor(pages);
    });
  }
  return {
    dailyTargetPages: Number.isFinite(raw.dailyTargetPages) ? Math.max(0, Math.floor(raw.dailyTargetPages)) : 0,
    log,
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

const store = createProgressStore(STORAGE_KEY, seedState, normalizeState);
const getState = store.getCached;
const commit = store.update;
export const loadWirdPlanner = store.load;
export const getCachedWirdPlanner = store.getCached;
export const subscribeWirdPlanner = store.subscribe;

export function setDailyTargetPages(pages) {
  const value = Number(pages);
  if (!Number.isFinite(value)) return;
  const dailyTargetPages = Math.max(0, Math.floor(value));
  commit(state => ({ ...state, dailyTargetPages }));
}

export function logPagesToday(pages) {
  const value = Number(pages);
  if (!Number.isFinite(value)) return;
  const key = todayKey();
  commit(state => {
    const current = state.log[key] || 0;
    const next = Math.max(0, current + Math.trunc(value));
    return { ...state, log: { ...state.log, [key]: next } };
  });
}

export function resetKhatmah() {
  commit(state => ({ ...state, log: {} }));
}

export function useWirdPlanner() {
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    let mounted = true;
    loadWirdPlanner().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeWirdPlanner((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeWirdStats(state) };
}

export const _resetForTests = store.reset;
