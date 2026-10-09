import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuranBookmarks } from '@/hooks/quran/useQuranBookmarks';
import { pageAyahsForLayout } from '@/utils/quran/mushafIndex';

jest.mock('@/utils/quran/mushafIndex', () => ({ pageAyahsForLayout: jest.fn(() => []) }));

beforeEach(() => { jest.clearAllMocks(); AsyncStorage.setItem.mockResolvedValue(); });

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
