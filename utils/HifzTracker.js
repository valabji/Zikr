import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import { HIFZ_CONSTANTS } from '../constants/HifzConstants';
import { dateKey } from './HijriCalendar';
import surahsData from '../assets/quran/data/surahs.json';

const STORAGE_KEY = HIFZ_CONSTANTS.STORAGE_KEYS.PROGRESS;
const { STATUS } = HIFZ_CONSTANTS;

function seedState() {
  return { surahs: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.surahs !== 'object' || raw.surahs === null) {
    return seedState();
  }
  const surahs = {};
  Object.entries(raw.surahs).forEach(([id, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!Object.values(STATUS).includes(entry.status)) return;
    surahs[id] = {
      status: entry.status,
      lastReviewedDate: typeof entry.lastReviewedDate === 'string' ? entry.lastReviewedDate : null,
      reviewStage: Number.isFinite(entry.reviewStage) ? entry.reviewStage : 0,
    };
  });
  return { surahs };
}

export function getSurahEntry(state, surahId) {
  const entry = state?.surahs?.[surahId];
  return entry || { status: STATUS.NOT_STARTED, lastReviewedDate: null, reviewStage: 0 };
}

export function getNextReviewDate(entry) {
  if (entry.status !== STATUS.MEMORIZED || !entry.lastReviewedDate) return null;
  const stage = Math.min(entry.reviewStage, HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS.length - 1);
  const days = HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS[stage];
  const next = new Date(entry.lastReviewedDate);
  next.setDate(next.getDate() + days);
  return next;
}

export function isDueForReview(entry, fromDate = new Date()) {
  const next = getNextReviewDate(entry);
  if (!next) return false;
  return dateKey(next) <= dateKey(fromDate);
}

export function computeHifzStats(state, fromDate = new Date()) {
  let memorizedCount = 0;
  let inProgressCount = 0;
  let totalAyahMemorized = 0;
  let dueReviewCount = 0;

  surahsData.forEach((surah) => {
    const entry = getSurahEntry(state, surah.id);
    if (entry.status === STATUS.MEMORIZED) {
      memorizedCount++;
      totalAyahMemorized += surah.ayahCount;
      if (isDueForReview(entry, fromDate)) dueReviewCount++;
    } else if (entry.status === STATUS.IN_PROGRESS) {
      inProgressCount++;
    }
  });

  return {
    memorizedCount,
    inProgressCount,
    notStartedCount: HIFZ_CONSTANTS.TOTAL_SURAHS - memorizedCount - inProgressCount,
    totalAyahMemorized,
    totalAyahCount: HIFZ_CONSTANTS.TOTAL_AYAH_COUNT,
    percentMemorized: (totalAyahMemorized / HIFZ_CONSTANTS.TOTAL_AYAH_COUNT) * 100,
    dueReviewCount,
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

export async function loadHifzTracker() {
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

export function getCachedHifzTracker() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribeHifzTracker(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSurahStatus(surahId, status) {
  if (!Object.values(STATUS).includes(status)) return;
  const state = getState();
  const next = { ...state.surahs };
  if (status === STATUS.NOT_STARTED) {
    delete next[surahId];
  } else if (status === STATUS.MEMORIZED) {
    next[surahId] = { status: STATUS.MEMORIZED, lastReviewedDate: dateKey(new Date()), reviewStage: 0 };
  } else {
    next[surahId] = { status: STATUS.IN_PROGRESS, lastReviewedDate: null, reviewStage: 0 };
  }
  commit({ ...state, surahs: next });
}

export function markSurahReviewed(surahId) {
  const state = getState();
  const entry = getSurahEntry(state, surahId);
  if (entry.status !== STATUS.MEMORIZED) return;
  const reviewStage = Math.min(entry.reviewStage + 1, HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS.length - 1);
  commit({
    ...state,
    surahs: {
      ...state.surahs,
      [surahId]: { ...entry, lastReviewedDate: dateKey(new Date()), reviewStage },
    },
  });
}

export function useHifzTracker() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadHifzTracker().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeHifzTracker((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeHifzStats(state) };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
