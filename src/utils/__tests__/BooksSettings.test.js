import AsyncStorage from '@react-native-async-storage/async-storage';

const loadModule = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('@/utils/BooksSettings');
  });
  mod._resetForTests();
  return mod;
};

describe('BooksSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns defaults when storage is empty', async () => {
    const mod = await loadModule();
    const s = await mod.loadBooksSettings();
    expect(s.fontScale).toBe(1.0);
    expect(s.showTranslation).toBe(false);
    expect(s.lastBookId).toBeNull();
  });

  it('merges stored partial over defaults', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ fontScale: 1.5, lastBookId: 'nawawi40' }));
    const mod = await loadModule();
    const s = await mod.loadBooksSettings();
    expect(s.fontScale).toBe(1.5);
    expect(s.lastBookId).toBe('nawawi40');
    expect(s.showTranslation).toBe(false);
  });

  it('persists partial updates and merges into cache', async () => {
    const mod = await loadModule();
    await mod.loadBooksSettings();
    const next = await mod.setBooksSettings({ showTranslation: true });
    expect(next.showTranslation).toBe(true);
    expect(next.fontScale).toBe(1.0);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@books_settings', expect.any(String));
    const persisted = JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1]);
    expect(persisted.showTranslation).toBe(true);
    expect(mod.getCachedBooksSettings().showTranslation).toBe(true);
  });

  it('notifies subscribers and supports unsubscribe', async () => {
    const mod = await loadModule();
    await mod.loadBooksSettings();
    const fn = jest.fn();
    const unsub = mod.subscribeBooksSettings(fn);
    await mod.setBooksSettings({ fontScale: 2.0 });
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ fontScale: 2.0 }));
    unsub();
    fn.mockClear();
    await mod.setBooksSettings({ fontScale: 1.25 });
    expect(fn).not.toHaveBeenCalled();
  });
});
