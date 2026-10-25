import { createProgressStore } from '@/utils/createProgressStore';
import { useState, useEffect, useMemo } from 'react';
import { TASBIH_CONSTANTS } from '@/constants/TasbihConstants';
import { t } from '@/locales/i18n';

const { STORAGE_KEY, DEFAULT_COUNTERS, DEFAULT_DAILY_GOAL } = TASBIH_CONSTANTS;

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function computeTasbihStats(history, dailyGoal) {
  const h = history || {};
  const goal = dailyGoal > 0 ? dailyGoal : DEFAULT_DAILY_GOAL;
  const today = todayKey();
  const todayTotal = h[today] || 0;
  const goalPct = goal > 0 ? Math.min(100, Math.round((todayTotal / goal) * 100)) : 0;
  const dayMs = 86400000;
  const todayMs = new Date(today).getTime();
  const last7Days = [];
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const ms = todayMs - i * dayMs;
    const key = new Date(ms).toISOString().slice(0, 10);
    const count = h[key] || 0;
    last7Days.push({ date: key, count });
    weeklyTotal += count;
  }
  for (let i = 0; i < 30; i++) {
    const key = new Date(todayMs - i * dayMs).toISOString().slice(0, 10);
    monthlyTotal += h[key] || 0;
  }
  return { todayTotal, dailyGoal: goal, goalPct, last7Days, weeklyTotal, monthlyTotal };
}

export function computeCounterStats(counter) {
  const h = (counter && counter.history) || {};
  const today = todayKey();
  const dayMs = 86400000;
  const todayMs = new Date(today).getTime();
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  for (let i = 0; i < 7; i++) {
    const key = new Date(todayMs - i * dayMs).toISOString().slice(0, 10);
    weeklyTotal += h[key] || 0;
  }
  for (let i = 0; i < 30; i++) {
    const key = new Date(todayMs - i * dayMs).toISOString().slice(0, 10);
    monthlyTotal += h[key] || 0;
  }
  return { weeklyTotal, monthlyTotal };
}

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function seedState() {
  const counters = DEFAULT_COUNTERS.map((c) => ({
    id: genId(),
    nameKey: c.nameKey,
    name: null,
    count: 0,
    target: c.target || 0,
    rounds: 0,
    totalRounds: 0,
    total: 0,
    history: {},
    createdAt: Date.now(),
  }));
  return { counters, activeId: counters[0].id, dailyGoal: DEFAULT_DAILY_GOAL, history: {} };
}

function normalizeCounter(c) {
  return {
    id: c.id || genId(),
    nameKey: c.nameKey != null ? c.nameKey : null,
    name: c.name != null ? c.name : null,
    count: typeof c.count === 'number' ? c.count : 0,
    target: typeof c.target === 'number' ? c.target : 0,
    rounds: typeof c.rounds === 'number' ? c.rounds : 0,
    totalRounds: typeof c.totalRounds === 'number' ? c.totalRounds : (c.rounds || 0),
    total: typeof c.total === 'number' ? c.total : 0,
    history: c.history && typeof c.history === 'object' ? c.history : {},
    createdAt: c.createdAt || Date.now(),
  };
}

function normalizeState(raw) {
  if (!raw || !Array.isArray(raw.counters) || raw.counters.length === 0) return seedState();
  const counters = raw.counters.map(normalizeCounter);
  const activeId = counters.some((c) => c.id === raw.activeId) ? raw.activeId : counters[0].id;
  const dailyGoal = typeof raw.dailyGoal === 'number' && raw.dailyGoal > 0 ? raw.dailyGoal : DEFAULT_DAILY_GOAL;
  const history = raw.history && typeof raw.history === 'object' ? raw.history : {};
  return { counters, activeId, dailyGoal, history };
}

const store = createProgressStore(STORAGE_KEY, seedState, normalizeState);

export const loadTasbih = store.load;
export const getCachedTasbih = store.getCached;
export const subscribeTasbih = store.subscribe;

export function getCounterDisplayName(counter) {
  if (!counter) return '';
  return counter.nameKey ? t(counter.nameKey) : (counter.name || '');
}

export function increment() {
  let result = { completed: false };
  const today = todayKey();
  store.update((state) => {
    const counters = state.counters.map((c) => {
      if (c.id !== state.activeId) return c;
      const total = c.total + 1;
      const counterHistory = { ...(c.history || {}) };
      counterHistory[today] = (counterHistory[today] || 0) + 1;
      if (c.target > 0 && c.count + 1 >= c.target) {
        result = { completed: true };
        return { ...c, total, rounds: c.rounds + 1, totalRounds: c.totalRounds + 1, count: 0, history: counterHistory };
      }
      return { ...c, total, count: c.count + 1, history: counterHistory };
    });
    const history = { ...(state.history || {}) };
    history[today] = (history[today] || 0) + 1;
    return { ...state, counters, history };
  });
  return result;
}

export function setDailyGoal(goal) {
  store.update((state) => {
    return { ...state, dailyGoal: Number.isFinite(Number(goal)) && Number(goal) > 0 ? Number(goal) : DEFAULT_DAILY_GOAL };
  });
}

export function resetActive(resetRounds = false) {
  store.update((state) => {
    const counters = state.counters.map((c) =>
      c.id === state.activeId ? { ...c, count: 0, rounds: resetRounds ? 0 : c.rounds } : c
    );
    return { ...state, counters };
  });
}

export function setActiveId(id) {
  store.update((state) => {
    if (!state.counters.some((c) => c.id === id)) return state;
    return { ...state, activeId: id };
  });
}

export function addCounter({ name, target } = {}) {
  const counter = {
    id: genId(),
    nameKey: null,
    name: name || null,
    count: 0,
    target: Number(target) || 0,
    rounds: 0,
    totalRounds: 0,
    total: 0,
    history: {},
    createdAt: Date.now(),
  };
  store.update((state) => {
    return { ...state, counters: [...state.counters, counter], activeId: counter.id };
  });
  return counter;
}

export function renameCounter(id, name) {
  store.update((state) => {
    const counters = state.counters.map((c) =>
      c.id === id ? { ...c, name, nameKey: null } : c
    );
    return { ...state, counters };
  });
}

export function setTarget(id, target) {
  store.update((state) => {
    const counters = state.counters.map((c) =>
      c.id === id ? { ...c, target: Number(target) || 0 } : c
    );
    return { ...state, counters };
  });
}

export function deleteCounter(id) {
  store.update((state) => {
    if (state.counters.length <= 1) return state;
    const counters = state.counters.filter((c) => c.id !== id);
    const activeId = state.activeId === id ? counters[0].id : state.activeId;
    return { ...state, counters, activeId };
  });
}

export function moveCounter(id, direction) {
  store.update((state) => {
    const index = state.counters.findIndex((c) => c.id === id);
    if (index < 0) return state;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= state.counters.length) return state;
    const counters = [...state.counters];
    [counters[index], counters[target]] = [counters[target], counters[index]];
    return { ...state, counters };
  });
}

export function useTasbih() {
  const [state, setState] = useState(getCachedTasbih);
  useEffect(() => {
    let mounted = true;
    loadTasbih().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeTasbih((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  const active = state.counters.find((c) => c.id === state.activeId);
  const stats = useMemo(() => computeTasbihStats(state.history, state.dailyGoal), [state.history, state.dailyGoal]);
  return {
    state,
    active,
    stats,
    increment,
    resetActive,
    setActiveId,
    addCounter,
    renameCounter,
    setTarget,
    deleteCounter,
    moveCounter,
    setDailyGoal,
  };
}

export const _resetForTests = store.reset;
