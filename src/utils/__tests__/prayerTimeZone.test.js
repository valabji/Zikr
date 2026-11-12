import moment from 'moment-timezone';
import { normalizePrayerLocation, prayerDate } from '@/utils/prayer/prayerTimeZone';
import { calculatePrayerTimes } from '@/utils/prayer/PrayerUtils';

it('repairs a searched city saved with the phone time zone', () => {
  expect(normalizePrayerLocation({ latitude: 51.5074, longitude: -0.1278, timezone: 'Africa/Cairo' }).timezone).toBe('Europe/London');
});

it('keeps a valid manual correction and rejects invalid coordinates', () => {
  const location = { latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/Paris', timezoneOverride: true };
  expect(normalizePrayerLocation(location)).toEqual(location);
  expect(normalizePrayerLocation({ ...location, timezone: 'invalid' }).timezone).toBe('Europe/London');
  expect(normalizePrayerLocation({ latitude: 91, longitude: 0 })).toBeNull();
  expect(normalizePrayerLocation({ latitude: NaN, longitude: 0 })).toBeNull();
});

it.each([
  ['Asia/Tokyo', '2026-07-01T23:00:00Z', 0, '2026-07-02'],
  ['America/New_York', '2026-07-01T01:00:00Z', 0, '2026-06-30'],
  ['America/New_York', '2026-03-08T04:30:00Z', 1, '2026-03-08'],
])('uses the calendar day in %s including midnight and DST', (timezone, instant, offset, expected) => {
  expect(moment(prayerDate(timezone, offset, new Date(instant))).format('YYYY-MM-DD')).toBe(expected);
});

it('calculates today in the location zone when the phone is on another day', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-07-01T23:00:00Z'));
  try {
    const times = calculatePrayerTimes(35.6762, 139.6503, 'Asia/Tokyo');
    expect(times.dhuhr.format('YYYY-MM-DD')).toBe('2026-07-02');
  } finally { jest.useRealTimers(); }
});
