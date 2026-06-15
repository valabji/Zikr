import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import { TASBIH_CONSTANTS } from '../constants/TasbihConstants';
import { t } from '../locales/i18n';

const { STORAGE_KEY, DEFAULT_COUNTERS } = TASBIH_CONSTANTS;

let cached = null;
let persistTimer = null;
let appStateListenerRegistered = false;
const listeners = new Set();

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
    total: 0,
    createdAt: Date.now(),
  }));
  return { counters, activeId: counters[0].id };
}

function normalizeCounter(c) {
  return {
    id: c.id || genId(),
    nameKey: c.nameKey != null ? c.nameKey : null,
    name: c.name != null ? c.name : null,
    count: typeof c.count === 'number' ? c.count : 0,
    target: typeof c.target === 'number' ? c.target : 0,
    rounds: typeof c.rounds === 'number' ? c.rounds : 0,
    total: typeof c.total === 'number' ? c.total : 0,
    createdAt: c.createdAt || Date.now(),
  };
}

function normalizeState(raw) {
  if (!raw || !Array.isArray(raw.counters) || raw.counters.length === 0) return seedState();
  const counters = raw.counters.map(normalizeCounter);
  const activeId = counters.some((c) => c.id === raw.activeId) ? raw.activeId : counters[0].id;
  return { counters, activeId };
}

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

export async function loadTasbih() {
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

export function getCachedTasbih() {
  if (!cached) cached = seedState();
  return cached;
}

export function subscribeTasbih(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getCounterDisplayName(counter) {
  if (!counter) return '';
  return counter.nameKey ? t(counter.nameKey) : (counter.name || '');
}

export function increment() {
  const state = getState();
  let result = { completed: false };
  const counters = state.counters.map((c) => {
    if (c.id !== state.activeId) return c;
    const total = c.total + 1;
    if (c.target > 0 && c.count + 1 >= c.target) {
      result = { completed: true };
      return { ...c, total, rounds: c.rounds + 1, count: 0 };
    }
    return { ...c, total, count: c.count + 1 };
  });
  commit({ ...state, counters });
  return result;
}

export function resetActive() {
  const state = getState();
  const counters = state.counters.map((c) =>
    c.id === state.activeId ? { ...c, count: 0 } : c
  );
  commit({ ...state, counters });
}

export function setActiveId(id) {
  const state = getState();
  if (!state.counters.some((c) => c.id === id)) return;
  commit({ ...state, activeId: id });
}

export function addCounter({ name, target } = {}) {
  const state = getState();
  const counter = {
    id: genId(),
    nameKey: null,
    name: name || null,
    count: 0,
    target: Number(target) || 0,
    rounds: 0,
    total: 0,
    createdAt: Date.now(),
  };
  commit({ counters: [...state.counters, counter], activeId: counter.id });
  return counter;
}

export function renameCounter(id, name) {
  const state = getState();
  const counters = state.counters.map((c) =>
    c.id === id ? { ...c, name, nameKey: null } : c
  );
  commit({ ...state, counters });
}

export function setTarget(id, target) {
  const state = getState();
  const counters = state.counters.map((c) =>
    c.id === id ? { ...c, target: Number(target) || 0 } : c
  );
  commit({ ...state, counters });
}

export function deleteCounter(id) {
  const state = getState();
  if (state.counters.length <= 1) return;
  const counters = state.counters.filter((c) => c.id !== id);
  const activeId = state.activeId === id ? counters[0].id : state.activeId;
  commit({ counters, activeId });
}

export function moveCounter(id, direction) {
  const state = getState();
  const index = state.counters.findIndex((c) => c.id === id);
  if (index < 0) return;
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= state.counters.length) return;
  const counters = [...state.counters];
  [counters[index], counters[target]] = [counters[target], counters[index]];
  commit({ ...state, counters });
}

export function useTasbih() {
  const [state, setState] = useState(() => cached || seedState());
  useEffect(() => {
    let mounted = true;
    loadTasbih().then((s) => { if (mounted) setState(s); });
    const unsubscribe = subscribeTasbih((s) => { if (mounted) setState(s); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  const active = state.counters.find((c) => c.id === state.activeId);
  return {
    state,
    active,
    increment,
    resetActive,
    setActiveId,
    addCounter,
    renameCounter,
    setTarget,
    deleteCounter,
    moveCounter,
  };
}

export function _resetForTests() {
  cached = null;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
