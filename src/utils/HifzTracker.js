import { createProgressStore } from '@/utils/createProgressStore';
import { useState, useEffect } from 'react';
import { HIFZ_CONSTANTS } from '@/constants/HifzConstants';
import { dateKey } from '@/utils/calendar/HijriCalendar';
import surahsData from '@assets/quran/data/surahs.json';

const STORAGE_KEY = HIFZ_CONSTANTS.STORAGE_KEYS.PROGRESS;
const { STATUS } = HIFZ_CONSTANTS;

function seedState() {
  return { surahs: {} };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.surahs !== 'object' || raw.surahs === null || Array.isArray(raw.surahs)) {
    return seedState();
  }
  const surahs = {};
  Object.entries(raw.surahs).forEach(([id, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!Object.values(STATUS).includes(entry.status)) return;
    surahs[id] = {
      status: entry.status,
      lastReviewedDate: typeof entry.lastReviewedDate === 'string' ? entry.lastReviewedDate : null,
      reviewStage: Number.isFinite(entry.reviewStage) ? Math.max(0, Math.min(Math.floor(entry.reviewStage), HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS.length - 1)) : 0,
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
  const stage = Math.max(0, Math.min(Number.isFinite(entry.reviewStage) ? Math.floor(entry.reviewStage) : 0, HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS.length - 1));
  const days = HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS[stage];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.lastReviewedDate);
  if (!match) return null;
  const next = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (dateKey(next) !== entry.lastReviewedDate) return null;
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

const store = createProgressStore(STORAGE_KEY, seedState, normalizeState);
const getState = store.getCached;
const commit = store.update;
export const loadHifzTracker = store.load;
export const getCachedHifzTracker = store.getCached;
export const subscribeHifzTracker = store.subscribe;

export function setSurahStatus(surahId, status) {
  if (!Object.values(STATUS).includes(status)) return;
  const today = dateKey(new Date());
  commit(state => {
    const next = { ...state.surahs };
    if (status === STATUS.NOT_STARTED) delete next[surahId];
    else next[surahId] = {
      status,
      lastReviewedDate: status === STATUS.MEMORIZED ? today : null,
      reviewStage: 0,
    };
    return { ...state, surahs: next };
  });
}

export function markSurahReviewed(surahId) {
  const today = dateKey(new Date());
  commit(state => {
    const entry = getSurahEntry(state, surahId);
    if (entry.status !== STATUS.MEMORIZED) return state;
    const reviewStage = Math.min(entry.reviewStage + 1, HIFZ_CONSTANTS.REVIEW_INTERVALS_DAYS.length - 1);
    return {
      ...state,
      surahs: { ...state.surahs, [surahId]: { ...entry, lastReviewedDate: today, reviewStage } },
    };
  });
}

export function useHifzTracker() {
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    let mounted = true;
    loadHifzTracker().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeHifzTracker((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { state, stats: computeHifzStats(state) };
}

export const _resetForTests = store.reset;
