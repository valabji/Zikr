import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Fasting from '@/utils/calendar/FastingTracker';
import * as Prayer from '@/utils/prayer/PrayerCheckIn';
import * as Hifz from '@/utils/HifzTracker';
import * as Wird from '@/utils/WirdPlanner';
import * as Azkar from '@/utils/azkar/AzkarHistory';

const cases = [
  ['fasting', Fasting, 'FastingTracker', { days: { '2025-01-01': 1 } }, () => Fasting.toggleFastDay('2025-01-02'), s => s.days['2025-01-01']],
  ['prayer', Prayer, 'PrayerCheckIn', { days: { '2025-01-01': { fajr: 1 } } }, () => Prayer.togglePrayerCheckInForDate('asr', '2025-01-02'), s => s.days['2025-01-01']],
  ['hifz', Hifz, 'HifzTracker', { surahs: { 1: { status: 'in_progress', lastReviewedDate: null, reviewStage: 0 } } }, () => Hifz.setSurahStatus(2, 'in_progress'), s => s.surahs[1]],
  ['wird', Wird, 'WirdPlanner', { dailyTargetPages: 10, log: { '2025-01-01': 4 } }, () => Wird.logPagesToday(2), s => s.log['2025-01-01']],
  ['azkar', Azkar, 'AzkarHistory', { morning: { '2025-01-01': 1 }, evening: {} }, () => Azkar.logAzkarCompletion(Azkar.EVENING_CATEGORY), s => s.morning['2025-01-01']],
];

describe.each(cases)('%s startup persistence', (_name, mod, suffix, saved, mutate, historical) => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mod._resetForTests();
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(saved));
  });
  afterEach(() => { mod._resetForTests(); jest.useRealTimers(); });

  it('does not let a cached read bypass storage hydration', async () => {
    mod[`getCached${suffix}`]();
    expect(await mod[`load${suffix}`]()).toEqual(saved);
  });

  it('deduplicates concurrent loads and preserves edits made while loading', async () => {
    let resolve;
    AsyncStorage.getItem.mockImplementation(() => new Promise(r => { resolve = r; }));
    const first = mod[`load${suffix}`]();
    const second = mod[`load${suffix}`]();
    mutate();
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    resolve(JSON.stringify(saved));
    await Promise.all([first, second]);
    const state = mod[`getCached${suffix}`]();
    expect(historical(state)).toEqual(historical(saved));
    expect(state).not.toEqual(saved);
    jest.advanceTimersByTime(600);
    await Promise.resolve();
    expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1])).toEqual(state);
  });
});

describe.each([
  ['fasting', Fasting, 'FastingTracker', { days: { '2025-01-01': 1, '2025-01-02': 2 } }, () => Fasting.toggleFastDay('2025-01-01'), s => s.days['2025-01-01']],
  ['prayer', Prayer, 'PrayerCheckIn', { days: { '2025-01-01': { fajr: 1, asr: 2 } } }, () => Prayer.togglePrayerCheckInForDate('fajr', '2025-01-01'), s => s.days['2025-01-01'].fajr],
])('%s early toggles', (_name, mod, suffix, saved, toggle, selected) => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mod._resetForTests();
    AsyncStorage.setItem.mockResolvedValue();
  });
  afterEach(() => { mod._resetForTests(); jest.useRealTimers(); });

  it.each([1, 2])('preserves the intended selection after %i taps while loading', async taps => {
    let resolve;
    AsyncStorage.getItem.mockImplementation(() => new Promise(r => { resolve = r; }));
    const loading = mod[`load${suffix}`]();
    for (let i = 0; i < taps; i++) toggle();
    expect(!!selected(mod[`getCached${suffix}`]())).toBe(taps === 1);
    resolve(JSON.stringify(saved));
    const state = await loading;
    expect(!!selected(state)).toBe(taps === 1);
    if (taps === 1) expect(state).toEqual(saved);
    jest.advanceTimersByTime(500);
    expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1])).toEqual(state);
  });
});
