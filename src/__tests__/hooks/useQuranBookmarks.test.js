import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuranBookmarks, _resetForTests } from '@/hooks/quran/useQuranBookmarks';
import { pageAyahsForLayout } from '@/utils/quran/mushafIndex';

jest.mock('@/utils/quran/mushafIndex', () => ({ pageAyahsForLayout: jest.fn(() => []) }));

beforeEach(() => { _resetForTests(); jest.clearAllMocks(); AsyncStorage.setItem.mockResolvedValue(); });

it.each(['null', '{}', '[null, {"page": -1}, {"page": 1}]'])('safely loads saved bookmarks %s', async (raw) => {
  AsyncStorage.getItem.mockResolvedValue(raw);
  const hook = renderHook(() => useQuranBookmarks(1, 'layout'));
  await act(async () => {});
  expect(Array.isArray(hook.result.current.bookmarks)).toBe(true);
  expect(hook.result.current.bookmarks.every((b) => b.page === 1)).toBe(true);
});

it('does not crash if the page has no ayah mapping', async () => {
  AsyncStorage.getItem.mockResolvedValue(null);
  pageAyahsForLayout.mockReturnValue([]);
  const hook = renderHook(() => useQuranBookmarks(1, 'layout'));
  await act(async () => {});
  act(() => hook.result.current.toggleBookmark());
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('preserves existing bookmarks when toggling before storage finishes loading', async () => {
  let resolve;
  AsyncStorage.getItem.mockImplementation(() => new Promise(r => { resolve = r; }));
  pageAyahsForLayout.mockReturnValue([{ surah: 1, ayah: 1 }]);
  const hook = renderHook(() => useQuranBookmarks(1, 'layout'));
  act(() => hook.result.current.toggleBookmark());
  await act(async () => { resolve(JSON.stringify([{ page: 2, surah: 2, ayah: 1 }])); });
  expect(hook.result.current.bookmarks.map(b => b.page)).toEqual([2, 1]);
});

it('applies two rapid toggles without a stale render snapshot', async () => {
  AsyncStorage.getItem.mockResolvedValue('[]');
  pageAyahsForLayout.mockReturnValue([{ surah: 1, ayah: 1 }]);
  const hook = renderHook(() => useQuranBookmarks(1, 'layout'));
  await act(async () => {});
  act(() => { hook.result.current.toggleBookmark(); hook.result.current.toggleBookmark(); });
  expect(hook.result.current.bookmarks).toEqual([]);
});

it.each([1, 2])('preserves the intended bookmark state after %i early taps on a saved page', async taps => {
  jest.useFakeTimers();
  let resolve;
  AsyncStorage.getItem.mockImplementation(() => new Promise(r => { resolve = r; }));
  pageAyahsForLayout.mockReturnValue([{ surah: 1, ayah: 1 }]);
  const saved = [
    { page: 1, surah: 1, ayah: 1, addedAt: 123, note: 'Keep this note' },
    { page: 2, surah: 2, ayah: 1 },
  ];
  const hook = renderHook(() => useQuranBookmarks(1, 'layout'));
  act(() => { for (let i = 0; i < taps; i++) hook.result.current.toggleBookmark(); });
  expect(hook.result.current.isBookmarked).toBe(taps === 1);
  await act(async () => { resolve(JSON.stringify(saved)); });
  const expected = taps === 1 ? saved : [saved[1]];
  expect(hook.result.current.bookmarks).toEqual(expected);
  act(() => { jest.advanceTimersByTime(500); });
  expect(JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1])).toEqual(expected);
});

afterEach(() => { _resetForTests(); jest.useRealTimers(); });
