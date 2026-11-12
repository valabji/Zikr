import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { usePrayerCountdown } from '@/hooks/prayer/usePrayerCountdown';

const location = { latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-07-01T14:55:00Z'));
});
afterEach(() => jest.useRealTimers());

it.each(['foreground', 'timer'])('refreshes the location day after missing midnight via %s', async trigger => {
  const { result } = renderHook(() => usePrayerCountdown({ location }));
  expect(result.current.prayerTimes.dhuhr.format('YYYY-MM-DD')).toBe('2026-07-01');
  jest.setSystemTime(new Date('2026-07-01T23:00:00Z'));
  await act(async () => {
    if (trigger === 'foreground') {
      AppState.addEventListener.mock.calls.find(([event]) => event === 'change')?.[1]('active');
    } else {
      await jest.advanceTimersByTimeAsync(60000);
    }
  });
  expect(result.current.prayerTimes.dhuhr.format('YYYY-MM-DD')).toBe('2026-07-02');
  expect(result.current.nextPrayer.name).toBe('dhuhr');
});
