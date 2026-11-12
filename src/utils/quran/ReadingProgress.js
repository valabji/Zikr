import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_CONSTANTS } from '@/constants/QuranConstants';

const STORAGE_KEY = QURAN_CONSTANTS.STORAGE_KEYS.READING_PROGRESS;
const TOTAL_PAGES = QURAN_CONSTANTS.TOTAL_PAGES;

let cached = null;
let loading = null;
let writes = Promise.resolve();
const listeners = new Set();

function todayKey() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

function computeStats(data) {
  const today = todayKey();
  const todayPages = data[today] || [];
  const todayCount = todayPages.length;

  const allPages = new Set();
  Object.values(data).forEach((pages) => pages.forEach((p) => allPages.add(p)));
  const totalUnique = allPages.size;
  const completionPct = Math.round((totalUnique / TOTAL_PAGES) * 100);

  const daySet = new Set(Object.keys(data).filter((k) => data[k].length > 0));
  let streak = 0;
  let check = new Date(today).getTime();
  // Preserve a streak through the morning before today's first reading.
  if (!daySet.has(today)) check -= 86400000;
  while (daySet.has(new Date(check).toISOString().slice(0, 10))) {
    streak++;
    check -= 86400000;
  }

  const dayMs = 86400000;
  const todayMs = new Date(today).getTime();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const ms = todayMs - i * dayMs;
    const key = new Date(ms).toISOString().slice(0, 10);
    last7Days.push({ date: key, count: (data[key] || []).length });
  }

  return { todayCount, streak, totalUnique, completionPct, last7Days };
}

async function readStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cached = {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.entries(parsed).forEach(([day, pages]) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(pages)) {
          cached[day] = [...new Set(pages.filter((p) => Number.isInteger(p) && p >= 1 && p <= TOTAL_PAGES))];
        }
      });
    }
  } catch {
    cached = {};
  }
  return cached;
}

async function load() {
  if (cached !== null) return cached;
  if (!loading) loading = readStorage().finally(() => { loading = null; });
  return loading;
}

export async function trackPage(pageNumber) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_PAGES) return;
  const data = await load();
  const today = todayKey();
  const existing = data[today] || [];
  if (existing.includes(pageNumber)) return;
  data[today] = [...existing, pageNumber];
  cached = data;
  const snapshot = JSON.stringify(data);
  writes = writes.then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot)).catch(() => {});
  await writes;
  const stats = computeStats(data);
  listeners.forEach((fn) => { try { fn(stats); } catch {} });
}

export async function getStats() {
  const data = await load();
  return computeStats(data);
}

export function subscribeProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
