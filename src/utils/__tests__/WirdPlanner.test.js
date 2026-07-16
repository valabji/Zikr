import AsyncStorage from '@react-native-async-storage/async-storage';

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('@/utils/WirdPlanner');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

function todayKey(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

describe('WirdPlanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds empty state when storage is empty', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadWirdPlanner();
    expect(state).toEqual({ dailyTargetPages: 0, log: {} });
  });

  it('normalizes malformed stored JSON', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ dailyTargetPages: 'bad', log: 'bad' }));
    const mod = await loadAndReset();
    const state = await mod.loadWirdPlanner();
    expect(state).toEqual({ dailyTargetPages: 0, log: {} });
  });

  it('setDailyTargetPages clamps to non-negative integers', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    mod.setDailyTargetPages(20);
    expect(mod.getCachedWirdPlanner().dailyTargetPages).toBe(20);
    mod.setDailyTargetPages(-5);
    expect(mod.getCachedWirdPlanner().dailyTargetPages).toBe(0);
  });

  it('logPagesToday accumulates pages for today and computeWirdStats reflects them', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    mod.setDailyTargetPages(10);
    mod.logPagesToday(5);
    mod.logPagesToday(5);
    const stats = mod.computeWirdStats(mod.getCachedWirdPlanner());
    expect(stats.todayPages).toBe(10);
    expect(stats.todayTargetMet).toBe(true);
    expect(stats.totalPagesRead).toBe(10);
  });

  it('computeWirdStats tracks khatmah progress across the 604-page Quran', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    mod.logPagesToday(604 + 50);
    const stats = mod.computeWirdStats(mod.getCachedWirdPlanner());
    expect(stats.khatmahCount).toBe(1);
    expect(stats.currentKhatmahProgress).toBe(50);
  });

  it('resetKhatmah clears the log', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    mod.logPagesToday(100);
    mod.resetKhatmah();
    const stats = mod.computeWirdStats(mod.getCachedWirdPlanner());
    expect(stats.totalPagesRead).toBe(0);
  });

  it('computeWirdStats computes a consecutive-day streak based on the daily target', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    mod.setDailyTargetPages(5);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const state = mod.getCachedWirdPlanner();
    state.log[todayKey(today)] = 5;
    state.log[todayKey(yesterday)] = 5;
    const stats = mod.computeWirdStats(state, today);
    expect(stats.streak).toBe(2);
  });

  it('persists to AsyncStorage after logging pages (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.logPagesToday(3);
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@wird_planner', expect.any(String));
    jest.useRealTimers();
  });

  it('subscribeWirdPlanner notifies listeners on commit and unsubscribes correctly', async () => {
    const mod = await loadAndReset();
    await mod.loadWirdPlanner();
    const fn = jest.fn();
    const unsubscribe = mod.subscribeWirdPlanner(fn);
    mod.logPagesToday(1);
    expect(fn).toHaveBeenCalledTimes(1);
    unsubscribe();
    mod.logPagesToday(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
