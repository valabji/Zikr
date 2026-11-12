import { createProgressStore } from '@/utils/createProgressStore';
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

function seedState() {
  return { days: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return seedState();
  return { days: raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {} };
}

const store = createProgressStore(STORAGE_KEY, seedState, normalizeState);
const getState = store.getCached;
const commit = store.update;
export const loadPrayerCheckIn = store.load;
export const getCachedPrayerCheckIn = store.getCached;
export const subscribePrayerCheckIn = store.subscribe;

export function togglePrayerCheckIn(prayerName) {
  togglePrayerCheckInForDate(prayerName, todayKey());
}

export function togglePrayerCheckInForDate(prayerName, dateKey) {
  if (!MANDATORY_PRAYERS.includes(prayerName)) return;
  const checked = !getState().days[dateKey]?.[prayerName];
  const timestamp = Date.now();
  commit(state => {
    const day = { ...(state.days[dateKey] || {}) };
    if (checked) day[prayerName] = day[prayerName] || timestamp;
    else delete day[prayerName];
    return { ...state, days: { ...state.days, [dateKey]: day } };
  });
}

export function usePrayerCheckIn() {
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    let mounted = true;
    loadPrayerCheckIn().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribePrayerCheckIn((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computePrayerCheckInStats(state) };
}

export const _resetForTests = store.reset;
