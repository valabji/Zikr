import { createProgressStore } from '@/utils/createProgressStore';
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

function seedState() {
  return { morning: {}, evening: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return {
    morning: raw.morning && typeof raw.morning === 'object' && !Array.isArray(raw.morning) ? raw.morning : {},
    evening: raw.evening && typeof raw.evening === 'object' && !Array.isArray(raw.evening) ? raw.evening : {},
  };
}

const store = createProgressStore(STORAGE_KEY, seedState, normalizeState);
const getState = store.getCached;
const commit = store.update;
export const loadAzkarHistory = store.load;
export const getCachedAzkarHistory = store.getCached;
export const subscribeAzkarHistory = store.subscribe;

export function logAzkarCompletion(category) {
  const key = category === MORNING_CATEGORY ? 'morning' : category === EVENING_CATEGORY ? 'evening' : null;
  if (!key) return;
  const today = todayKey();
  const timestamp = Date.now();
  commit(state => state[key][today] ? state : {
    ...state, [key]: { ...state[key], [today]: timestamp },
  });
}

export function useAzkarHistory() {
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    let mounted = true;
    loadAzkarHistory().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeAzkarHistory((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { history: state, stats: computeAzkarStats(state) };
}

export const _resetForTests = store.reset;
