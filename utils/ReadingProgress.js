import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_CONSTANTS } from '../constants/QuranConstants';

const STORAGE_KEY = QURAN_CONSTANTS.STORAGE_KEYS.READING_PROGRESS;
const TOTAL_PAGES = QURAN_CONSTANTS.TOTAL_PAGES;

let cached = null;
const listeners = new Set();

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function computeStats(data) {
  const today = todayKey();
  const todayPages = data[today] || [];
  const todayCount = todayPages.length;

  const allPages = new Set();
  Object.values(data).forEach((pages) => pages.forEach((p) => allPages.add(p)));
  const totalUnique = allPages.size;
  const completionPct = Math.round((totalUnique / TOTAL_PAGES) * 100);

  const days = Object.keys(data).filter((k) => data[k].length > 0).sort();
  let streak = 0;
  if (days.length > 0) {
    const todayMs = new Date(today).getTime();
    const dayMs = 86400000;
    let cursor = todayMs;
    // streak can end today or yesterday
    if (
      new Date(days[days.length - 1]).getTime() < todayMs - dayMs
    ) {
      streak = 0;
    } else {
      const daySet = new Set(days);
      let check = todayMs;
      while (true) {
        const key = new Date(check).toISOString().slice(0, 10);
        if (daySet.has(key)) {
          streak++;
          check -= dayMs;
        } else {
          break;
        }
      }
    }
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

async function load() {
  if (cached !== null) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cached = raw ? JSON.parse(raw) : {};
  } catch {
    cached = {};
  }
  return cached;
}

export async function trackPage(pageNumber) {
  const data = await load();
  const today = todayKey();
  const existing = data[today] || [];
  if (existing.includes(pageNumber)) return;
  data[today] = [...existing, pageNumber];
  cached = data;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
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
