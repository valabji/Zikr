import AsyncStorage from '@react-native-async-storage/async-storage';

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('../PrayerCheckIn');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

describe('PrayerCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds empty days when storage is empty', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadPrayerCheckIn();
    expect(state).toEqual({ days: {} });
  });

  it('normalizes malformed stored JSON', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ days: 'bad' }));
    const mod = await loadAndReset();
    const state = await mod.loadPrayerCheckIn();
    expect(state).toEqual({ days: {} });
  });

  it('togglePrayerCheckIn marks a prayer as prayed for today', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    mod.togglePrayerCheckIn('fajr');
    const stats = mod.computePrayerCheckInStats(mod.getCachedPrayerCheckIn());
    expect(stats.today.fajr).toBeTruthy();
    expect(stats.todayCount).toBe(1);
  });

  it('togglePrayerCheckIn unmarks an already-checked-in prayer', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    mod.togglePrayerCheckIn('fajr');
    mod.togglePrayerCheckIn('fajr');
    const stats = mod.computePrayerCheckInStats(mod.getCachedPrayerCheckIn());
    expect(stats.today.fajr).toBeUndefined();
    expect(stats.todayCount).toBe(0);
  });

  it('togglePrayerCheckIn ignores unknown prayer names', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    mod.togglePrayerCheckIn('sunrise');
    const state = mod.getCachedPrayerCheckIn();
    expect(state).toEqual({ days: {} });
  });

  it('completedToday is true only once all 5 mandatory prayers are checked in', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    ['fajr', 'dhuhr', 'asr', 'maghrib'].forEach((p) => mod.togglePrayerCheckIn(p));
    let stats = mod.computePrayerCheckInStats(mod.getCachedPrayerCheckIn());
    expect(stats.completedToday).toBe(false);
    mod.togglePrayerCheckIn('isha');
    stats = mod.computePrayerCheckInStats(mod.getCachedPrayerCheckIn());
    expect(stats.completedToday).toBe(true);
    expect(stats.streak).toBe(1);
  });

  it('computePrayerCheckInStats walks back consecutive complete days for a streak', async () => {
    const mod = await loadAndReset();
    const d = new Date();
    const keyFor = (offset) => {
      const c = new Date(d);
      c.setDate(c.getDate() - offset);
      const mm = String(c.getMonth() + 1).padStart(2, '0');
      const dd = String(c.getDate()).padStart(2, '0');
      return `${c.getFullYear()}-${mm}-${dd}`;
    };
    const fullDay = { fajr: 1, dhuhr: 1, asr: 1, maghrib: 1, isha: 1 };
    const state = {
      days: {
        [keyFor(0)]: fullDay,
        [keyFor(1)]: fullDay,
        [keyFor(2)]: { fajr: 1, dhuhr: 1 },
      },
    };
    const stats = mod.computePrayerCheckInStats(state);
    expect(stats.streak).toBe(2);
  });

  it('computePrayerCheckInStats returns zeroed stats for empty/missing state', async () => {
    const mod = await loadAndReset();
    const stats = mod.computePrayerCheckInStats(null);
    expect(stats.streak).toBe(0);
    expect(stats.todayCount).toBe(0);
    expect(stats.completedToday).toBe(false);
  });

  it('persists to AsyncStorage after toggling (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.togglePrayerCheckIn('fajr');
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@prayer_checkin', expect.any(String));
    jest.useRealTimers();
  });

  it('getCheckInHistory returns the requested number of days, most recent first', async () => {
    const mod = await loadAndReset();
    const d = new Date();
    const keyFor = (offset) => {
      const c = new Date(d);
      c.setDate(c.getDate() - offset);
      const mm = String(c.getMonth() + 1).padStart(2, '0');
      const dd = String(c.getDate()).padStart(2, '0');
      return `${c.getFullYear()}-${mm}-${dd}`;
    };
    const state = {
      days: {
        [keyFor(1)]: { fajr: 1, dhuhr: 1, asr: 1, maghrib: 1, isha: 1 },
      },
    };
    const history = mod.getCheckInHistory(state, 3);
    expect(history).toHaveLength(3);
    expect(history[0]).toMatchObject({ dateKey: keyFor(0), offsetDays: 0, count: 0, complete: false });
    expect(history[1]).toMatchObject({ dateKey: keyFor(1), offsetDays: 1, count: 5, complete: true });
  });

  it('togglePrayerCheckInForDate marks a prayer for a past date', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const pastKey = `${d.getFullYear()}-${mm}-${dd}`;
    mod.togglePrayerCheckInForDate('maghrib', pastKey);
    const state = mod.getCachedPrayerCheckIn();
    expect(state.days[pastKey].maghrib).toBeTruthy();
  });

  it('togglePrayerCheckInForDate unmarks on second call', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const pastKey = `${d.getFullYear()}-${mm}-${dd}`;
    mod.togglePrayerCheckInForDate('fajr', pastKey);
    mod.togglePrayerCheckInForDate('fajr', pastKey);
    const state = mod.getCachedPrayerCheckIn();
    expect(state.days[pastKey]?.fajr).toBeUndefined();
  });

  it('subscribePrayerCheckIn notifies listeners on commit and unsubscribes correctly', async () => {
    const mod = await loadAndReset();
    await mod.loadPrayerCheckIn();
    const fn = jest.fn();
    const unsubscribe = mod.subscribePrayerCheckIn(fn);
    mod.togglePrayerCheckIn('fajr');
    expect(fn).toHaveBeenCalledTimes(1);
    unsubscribe();
    mod.togglePrayerCheckIn('dhuhr');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
