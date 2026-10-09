import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSettingsStore } from '@/utils/createSettingsStore';

describe('settings store concurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  it('shares initial reads and preserves simultaneous changes to different settings', async () => {
    let resolveRead;
    AsyncStorage.getItem.mockReturnValue(new Promise((r) => { resolveRead = r; }));
    const store = createSettingsStore('settings', { font: 16, theme: 'light' });
    const first = store.set({ font: 24 });
    const second = store.set({ theme: 'dark' });
    resolveRead(null);
    await Promise.all([first, second]);
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    expect(store.getCached()).toEqual({ font: 24, theme: 'dark' });
    expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1])).toEqual(store.getCached());
  });

  it('serializes writes so a slow earlier write cannot overwrite a newer value', async () => {
    let finishFirst;
    AsyncStorage.setItem.mockImplementationOnce(() => new Promise((r) => { finishFirst = r; }));
    const store = createSettingsStore('settings', { font: 16 });
    await store.load();
    const first = store.set({ font: 20 });
    const second = store.set({ font: 30 });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    finishFirst();
    await Promise.all([first, second]);
    expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1]).font).toBe(30);
  });

  it.each(['null', '[]', '"invalid"'])('ignores malformed settings %s', async (raw) => {
    AsyncStorage.getItem.mockResolvedValue(raw);
    const store = createSettingsStore('settings', { font: 16 });
    expect(await store.load()).toEqual({ font: 16 });
  });
});
