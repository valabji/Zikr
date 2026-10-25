import { createProgressStore } from '@/utils/createProgressStore';
import { useState, useEffect } from 'react';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { dateKey, isWithinRamadan, getRamadanRange, toHijri } from '@/utils/calendar/HijriCalendar';

const STORAGE_KEY = ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.FASTING_TRACKER;

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
export const loadFastingTracker = store.load;
export const getCachedFastingTracker = store.getCached;
export const subscribeFastingTracker = store.subscribe;

export function isFastDay(key) {
  return !!getState().days[key];
}

export function toggleFastDay(key) {
  const checked = !isFastDay(key);
  const timestamp = Date.now();
  const next = commit(state => {
    const days = { ...state.days };
    if (checked) days[key] = days[key] || timestamp;
    else delete days[key];
    return { ...state, days };
  });
  return !!next.days[key];
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
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    let mounted = true;
    loadFastingTracker().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeFastingTracker((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeFastingStats(state) };
}

export const _resetForTests = store.reset;
