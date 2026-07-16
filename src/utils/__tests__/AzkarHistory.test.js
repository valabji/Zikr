import AsyncStorage from '@react-native-async-storage/async-storage';

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('@/utils/AzkarHistory');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

describe('AzkarHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds empty morning/evening history when storage is empty', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadAzkarHistory();
    expect(state).toEqual({ morning: {}, evening: {} });
  });

  it('normalizes malformed stored JSON', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ morning: null, evening: 'bad' }));
    const mod = await loadAndReset();
    const state = await mod.loadAzkarHistory();
    expect(state).toEqual({ morning: {}, evening: {} });
  });

  it('logAzkarCompletion records today under morning for the morning category', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    const state = mod.getCachedAzkarHistory();
    const todayKeys = Object.keys(state.morning);
    expect(todayKeys).toHaveLength(1);
    expect(Object.keys(state.evening)).toHaveLength(0);
  });

  it('logAzkarCompletion records today under evening for the evening category', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    mod.logAzkarCompletion(mod.EVENING_CATEGORY);
    const state = mod.getCachedAzkarHistory();
    expect(Object.keys(state.evening)).toHaveLength(1);
    expect(Object.keys(state.morning)).toHaveLength(0);
  });

  it('logAzkarCompletion ignores unknown categories', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    mod.logAzkarCompletion('something else');
    const state = mod.getCachedAzkarHistory();
    expect(state).toEqual({ morning: {}, evening: {} });
  });

  it('logAzkarCompletion does not overwrite an existing timestamp for today', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    const first = mod.getCachedAzkarHistory().morning;
    const firstTs = Object.values(first)[0];
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    const second = mod.getCachedAzkarHistory().morning;
    expect(Object.values(second)[0]).toBe(firstTs);
  });

  it('computeAzkarStats reports doneToday and a streak of 1 after logging today', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    const stats = mod.computeAzkarStats(mod.getCachedAzkarHistory());
    expect(stats.morningDoneToday).toBe(true);
    expect(stats.morningStreak).toBe(1);
    expect(stats.eveningDoneToday).toBe(false);
    expect(stats.eveningStreak).toBe(0);
  });

  it('computeAzkarStats returns zeroed stats for empty/missing history', async () => {
    const mod = await loadAndReset();
    const stats = mod.computeAzkarStats(null);
    expect(stats).toEqual({
      morningStreak: 0,
      eveningStreak: 0,
      morningDoneToday: false,
      eveningDoneToday: false,
    });
  });

  it('computeAzkarStats walks back consecutive days for a streak', async () => {
    const mod = await loadAndReset();
    const d = new Date();
    const keyFor = (offset) => {
      const c = new Date(d);
      c.setDate(c.getDate() - offset);
      const mm = String(c.getMonth() + 1).padStart(2, '0');
      const dd = String(c.getDate()).padStart(2, '0');
      return `${c.getFullYear()}-${mm}-${dd}`;
    };
    const history = {
      morning: { [keyFor(0)]: 1, [keyFor(1)]: 1, [keyFor(2)]: 1 },
      evening: {},
    };
    const stats = mod.computeAzkarStats(history);
    expect(stats.morningStreak).toBe(3);
  });

  it('computeAzkarStats stops the streak at the first missing day', async () => {
    const mod = await loadAndReset();
    const d = new Date();
    const keyFor = (offset) => {
      const c = new Date(d);
      c.setDate(c.getDate() - offset);
      const mm = String(c.getMonth() + 1).padStart(2, '0');
      const dd = String(c.getDate()).padStart(2, '0');
      return `${c.getFullYear()}-${mm}-${dd}`;
    };
    const history = {
      morning: { [keyFor(0)]: 1, [keyFor(2)]: 1 },
      evening: {},
    };
    const stats = mod.computeAzkarStats(history);
    expect(stats.morningStreak).toBe(1);
  });

  it('persists to AsyncStorage after logging a completion (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@azkar_history', expect.any(String));
    jest.useRealTimers();
  });

  it('subscribeAzkarHistory notifies listeners on commit and unsubscribes correctly', async () => {
    const mod = await loadAndReset();
    await mod.loadAzkarHistory();
    const fn = jest.fn();
    const unsubscribe = mod.subscribeAzkarHistory(fn);
    mod.logAzkarCompletion(mod.MORNING_CATEGORY);
    expect(fn).toHaveBeenCalledTimes(1);
    unsubscribe();
    mod.logAzkarCompletion(mod.EVENING_CATEGORY);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
