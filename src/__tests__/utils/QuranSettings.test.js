jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');
const { QURAN_CONSTANTS } = require('@/constants/QuranConstants');
const { loadQuranSettings, setQuranSettings, subscribeQuranSettings } = require('@/utils/quran/QuranSettings');

const KEY = QURAN_CONSTANTS.STORAGE_KEYS.SETTINGS;
const DEFAULTS = QURAN_CONSTANTS.DEFAULT_SETTINGS;

describe('QuranSettings', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns defaults when storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const s = await loadQuranSettings();
    expect(s).toEqual(expect.objectContaining(DEFAULTS));
  });

  it('setQuranSettings persists merged value and notifies listeners', async () => {
    const seen = [];
    const unsub = subscribeQuranSettings((v) => seen.push(v));
    await setQuranSettings({ fontScale: 1.5 });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const lastCall = AsyncStorage.setItem.mock.calls.at(-1);
    expect(lastCall[0]).toBe(KEY);
    expect(lastCall[1]).toEqual(expect.stringContaining('1.5'));
    expect(seen.at(-1).fontScale).toBe(1.5);
    unsub();
  });
});
