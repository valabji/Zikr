import AsyncStorage from '@react-native-async-storage/async-storage';

function loadModule() {
  let mod;
  jest.isolateModules(() => { mod = require('@/utils/quran/ReadingProgress'); });
  return mod;
}

describe('ReadingProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 9, 12));
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });
  afterEach(() => jest.useRealTimers());

  it('keeps yesterday’s streak before the first page read today', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ '2026-10-07': [1], '2026-10-08': [2] }));
    const mod = loadModule();
    expect((await mod.getStats()).streak).toBe(2);
    await mod.trackPage(3);
    expect((await mod.getStats()).streak).toBe(3);
  });

  it('drops a streak after a missed day', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ '2026-10-07': [1] }));
    expect((await loadModule().getStats()).streak).toBe(0);
  });

  it('normalizes invalid saved data and excludes invalid pages', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ '2026-10-09': [1, 1, 0, 605, '2'], '2026-10-08': {} }));
    const mod = loadModule();
    await mod.trackPage(-1);
    expect(await mod.getStats()).toMatchObject({ todayCount: 1, totalUnique: 1 });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('preserves pages recorded simultaneously during initialization', async () => {
    const mod = loadModule();
    await Promise.all([mod.trackPage(1), mod.trackPage(2)]);
    expect((await mod.getStats()).todayCount).toBe(2);
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1])['2026-10-09']).toEqual([1, 2]);
  });
});
