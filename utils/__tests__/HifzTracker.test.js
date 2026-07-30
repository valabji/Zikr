import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '../HijriCalendar';
import { HIFZ_CONSTANTS } from '../../constants/HifzConstants';

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('../HifzTracker');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

describe('HifzTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds empty state when storage is empty', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadHifzTracker();
    expect(state).toEqual({ surahs: {} });
  });

  it('normalizes malformed stored JSON', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ surahs: { 1: { status: 'bogus' } } }));
    const mod = await loadAndReset();
    const state = await mod.loadHifzTracker();
    expect(state).toEqual({ surahs: {} });
  });

  it('setSurahStatus cycles a surah through in_progress and memorized', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();

    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.IN_PROGRESS);
    let entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 1);
    expect(entry.status).toBe(HIFZ_CONSTANTS.STATUS.IN_PROGRESS);

    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.MEMORIZED);
    entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 1);
    expect(entry.status).toBe(HIFZ_CONSTANTS.STATUS.MEMORIZED);
    expect(entry.lastReviewedDate).toBe(dateKey(new Date()));

    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.NOT_STARTED);
    entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 1);
    expect(entry.status).toBe(HIFZ_CONSTANTS.STATUS.NOT_STARTED);
  });

  it('isDueForReview is true the day after memorizing (1-day interval) and false right after review', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();
    mod.setSurahStatus(2, HIFZ_CONSTANTS.STATUS.MEMORIZED);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 2);
    expect(mod.isDueForReview(entry, tomorrow)).toBe(true);
    expect(mod.isDueForReview(entry, new Date())).toBe(false);

    mod.markSurahReviewed(2);
    entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 2);
    expect(entry.reviewStage).toBe(1);
    expect(mod.isDueForReview(entry, tomorrow)).toBe(false);
  });

  it('markSurahReviewed is a no-op for surahs that are not memorized', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();
    mod.setSurahStatus(3, HIFZ_CONSTANTS.STATUS.IN_PROGRESS);
    mod.markSurahReviewed(3);
    const entry = mod.getSurahEntry(mod.getCachedHifzTracker(), 3);
    expect(entry.status).toBe(HIFZ_CONSTANTS.STATUS.IN_PROGRESS);
    expect(entry.lastReviewedDate).toBeNull();
  });

  it('computeHifzStats aggregates memorized ayah counts using surah data', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();
    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.MEMORIZED); // Al-Fatihah, 7 ayahs
    mod.setSurahStatus(114, HIFZ_CONSTANTS.STATUS.MEMORIZED); // An-Nas, 6 ayahs
    mod.setSurahStatus(2, HIFZ_CONSTANTS.STATUS.IN_PROGRESS);

    const stats = mod.computeHifzStats(mod.getCachedHifzTracker());
    expect(stats.memorizedCount).toBe(2);
    expect(stats.inProgressCount).toBe(1);
    expect(stats.totalAyahMemorized).toBe(13);
    expect(stats.totalAyahCount).toBe(HIFZ_CONSTANTS.TOTAL_AYAH_COUNT);
  });

  it('persists to AsyncStorage after a status change (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.MEMORIZED);
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@hifz_tracker', expect.any(String));
    jest.useRealTimers();
  });

  it('subscribeHifzTracker notifies listeners on commit and unsubscribes correctly', async () => {
    const mod = await loadAndReset();
    await mod.loadHifzTracker();
    const fn = jest.fn();
    const unsubscribe = mod.subscribeHifzTracker(fn);
    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.IN_PROGRESS);
    expect(fn).toHaveBeenCalledTimes(1);
    unsubscribe();
    mod.setSurahStatus(1, HIFZ_CONSTANTS.STATUS.MEMORIZED);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
