jest.unmock('@/utils/azkar/AzkarStore');

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAzkar, getAzkar, setAzkar, subscribeAzkar } from '@/utils/azkar/AzkarStore';

describe('AzkarStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with the bundled Azkar list', () => {
    expect(Array.isArray(getAzkar())).toBe(true);
    expect(getAzkar().length).toBeGreaterThan(0);
  });

  it('loads stored Azkar from AsyncStorage', async () => {
    const stored = [{ id: 99, category: 'persisted' }];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(stored));
    await expect(loadAzkar()).resolves.toEqual(stored);
    expect(getAzkar()).toEqual(stored);
  });

  it('falls back to the bundled list when nothing is stored', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const result = await loadAzkar();
    expect(result.length).toBeGreaterThan(0);
    expect(getAzkar()).toBe(result);
  });

  it('falls back to the bundled list when storage read fails', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('fail'));
    const result = await loadAzkar();
    expect(result.length).toBeGreaterThan(0);
  });

  it('setAzkar updates the cache, notifies subscribers, and persists', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeAzkar(listener);
    const next = [{ id: 1, fav: true }];
    setAzkar(next);
    expect(getAzkar()).toBe(next);
    expect(listener).toHaveBeenCalledWith(next);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@zikr', JSON.stringify(next));
    unsubscribe();
    setAzkar([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
