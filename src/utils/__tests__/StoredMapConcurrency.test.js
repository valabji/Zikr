import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLastRead, getLastRead, setBookmarks, getBookmarks } from '@/utils/books/BooksLibrary';
import { saveAzkarItemOrder, loadAzkarItemOrder } from '@/utils/azkar/AzkarOrder';
import { persistCustomTheme, loadCustomThemes } from '@/utils/theme/ThemeManager';
import { updateStoredMap } from '@/utils/updateStoredMap';

beforeEach(() => {
  jest.clearAllMocks();
  const disk = {};
  AsyncStorage.getItem.mockImplementation(async key => disk[key] ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => { disk[key] = value; });
});

it('retains reading positions for concurrently updated books', async () => {
  await Promise.all([setLastRead('one', 5), setLastRead('two', 10)]);
  expect(await getLastRead('one')).toBe(5);
  expect(await getLastRead('two')).toBe(10);
});

it('retains bookmarks for concurrently updated books', async () => {
  await Promise.all([setBookmarks('one', [5]), setBookmarks('two', [10])]);
  expect(await getBookmarks('one')).toEqual([5]);
  expect(await getBookmarks('two')).toEqual([10]);
});

it('retains concurrent azkar category order changes', async () => {
  const one = { mode: 'manual', manual: ['one'] };
  const two = { mode: 'manual', manual: ['two'] };
  await Promise.all([saveAzkarItemOrder('one', one), saveAzkarItemOrder('two', two)]);
  expect(await loadAzkarItemOrder('one')).toEqual(one);
  expect(await loadAzkarItemOrder('two')).toEqual(two);
});

it('retains concurrently saved custom themes', async () => {
  await Promise.all([persistCustomTheme('one', { name: 'One' }), persistCustomTheme('two', { name: 'Two' })]);
  expect(await loadCustomThemes()).toEqual({ one: { name: 'One' }, two: { name: 'Two' } });
});

it.each(['null', '[]', '{invalid'])('recovers malformed maps: %s', async raw => {
  AsyncStorage.getItem.mockResolvedValue(raw);
  await updateStoredMap('map', current => ({ ...current, ok: true }));
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('map', '{"ok":true}');
});

it('does not block later writes after a storage error', async () => {
  AsyncStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
  const first = updateStoredMap('map', () => ({ first: true }));
  const second = updateStoredMap('map', () => ({ second: true }));
  await expect(first).rejects.toThrow('disk full');
  await expect(second).resolves.toEqual({ second: true });
});
