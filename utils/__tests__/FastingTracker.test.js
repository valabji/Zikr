import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '../HijriCalendar';

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('../FastingTracker');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

describe('FastingTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds empty days when storage is empty', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadFastingTracker();
    expect(state).toEqual({ days: {} });
  });

  it('normalizes malformed stored JSON', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ days: 'bad' }));
    const mod = await loadAndReset();
    const state = await mod.loadFastingTracker();
    expect(state).toEqual({ days: {} });
  });

  it('toggleFastDay marks then unmarks a day', async () => {
    const mod = await loadAndReset();
    await mod.loadFastingTracker();
    const key = dateKey(new Date());
    expect(mod.isFastDay(key)).toBe(false);
    expect(mod.toggleFastDay(key)).toBe(true);
    expect(mod.isFastDay(key)).toBe(true);
    expect(mod.toggleFastDay(key)).toBe(false);
    expect(mod.isFastDay(key)).toBe(false);
  });

  it('computeFastingStats counts total fasts logged', async () => {
    const mod = await loadAndReset();
    await mod.loadFastingTracker();
    mod.toggleFastDay('2026-02-18');
    mod.toggleFastDay('2026-02-19');
    const stats = mod.computeFastingStats(mod.getCachedFastingTracker(), new Date(2026, 5, 1));
    expect(stats.totalFasts).toBe(2);
    expect(stats.inRamadan).toBe(false);
  });

  it('computeFastingStats reports Ramadan progress when the reference date is in Ramadan', async () => {
    const mod = await loadAndReset();
    await mod.loadFastingTracker();
    mod.toggleFastDay('2026-02-18');
    mod.toggleFastDay('2026-02-19');
    const stats = mod.computeFastingStats(mod.getCachedFastingTracker(), new Date(2026, 1, 20));
    expect(stats.inRamadan).toBe(true);
    expect(stats.ramadanFasted).toBe(2);
    expect(stats.ramadanTotal).toBeGreaterThanOrEqual(29);
  });

  it('persists to AsyncStorage after toggling (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadFastingTracker();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.toggleFastDay(dateKey(new Date()));
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@fasting_tracker', expect.any(String));
    jest.useRealTimers();
  });

  it('subscribeFastingTracker notifies listeners on commit and unsubscribes correctly', async () => {
    const mod = await loadAndReset();
    await mod.loadFastingTracker();
    const fn = jest.fn();
    const unsubscribe = mod.subscribeFastingTracker(fn);
    mod.toggleFastDay('2026-02-18');
    expect(fn).toHaveBeenCalledTimes(1);
    unsubscribe();
    mod.toggleFastDay('2026-02-19');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
