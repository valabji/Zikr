import { renderHook, act } from '@testing-library/react-native';
import { useLocationSearch } from '@/hooks/prayer/useLocationSearch';
import { searchLocations } from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

jest.mock('expo-location', () => ({}));

jest.mock('@/utils/prayer/PrayerUtils', () => ({ searchLocations: jest.fn() }));

describe('location search races', () => {
  beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
  afterEach(() => jest.useRealTimers());

  it('ignores a response after the query has been cleared', async () => {
    let finish;
    searchLocations.mockReturnValue(new Promise((r) => { finish = r; }));
    const { result } = renderHook(() => useLocationSearch(jest.fn()));
    act(() => result.current.handleSearch('Cairo'));
    act(() => jest.advanceTimersByTime(PRAYER_CONSTANTS.LOCATION_SEARCH.DEBOUNCE_DELAY));
    expect(result.current.isSearching).toBe(true);
    act(() => result.current.handleSearch(''));
    await act(async () => { finish([{ name: 'Cairo', country: 'Egypt' }]); });
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('retains the newest results when responses arrive out of order', async () => {
    let first;
    let second;
    searchLocations.mockImplementationOnce(() => new Promise((r) => { first = r; }))
      .mockImplementationOnce(() => new Promise((r) => { second = r; }));
    const { result } = renderHook(() => useLocationSearch(jest.fn()));
    act(() => result.current.handleSearch('Cairo'));
    act(() => jest.advanceTimersByTime(PRAYER_CONSTANTS.LOCATION_SEARCH.DEBOUNCE_DELAY));
    act(() => result.current.handleSearch('London'));
    act(() => jest.advanceTimersByTime(PRAYER_CONSTANTS.LOCATION_SEARCH.DEBOUNCE_DELAY));
    const latest = [{ name: 'London', country: 'UK' }];
    await act(async () => { second(latest); });
    await act(async () => { first([{ name: 'Cairo', country: 'Egypt' }]); });
    expect(result.current.searchResults).toEqual(latest);
  });
});
