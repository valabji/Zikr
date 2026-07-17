import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolvePrayerPeriod, getCurrentPrayerVariant, THEME_VARIANT_KEYS } from '@/utils/theme/ThemeVariant';

const makeTimes = (base) => ({
  fajr: moment(base).set({ hour: 5, minute: 0 }),
  sunrise: moment(base).set({ hour: 6, minute: 30 }),
  dhuhr: moment(base).set({ hour: 12, minute: 0 }),
  asr: moment(base).set({ hour: 15, minute: 30 }),
  maghrib: moment(base).set({ hour: 18, minute: 0 }),
  isha: moment(base).set({ hour: 19, minute: 30 }),
});

describe('THEME_VARIANT_KEYS', () => {
  it('exposes the four prayer-time variant keys', () => {
    expect(THEME_VARIANT_KEYS).toEqual(['fajr', 'duha', 'asr', 'isha']);
  });
});

describe('resolvePrayerPeriod', () => {
  const base = '2026-06-18T00:00:00';
  const times = makeTimes(base);

  it('returns null when times are missing', () => {
    expect(resolvePrayerPeriod(null, moment(base))).toBeNull();
  });

  it('returns isha before fajr', () => {
    expect(resolvePrayerPeriod(times, moment(base).set({ hour: 4, minute: 0 }))).toBe('isha');
  });

  it('returns fajr between fajr and sunrise', () => {
    expect(resolvePrayerPeriod(times, moment(base).set({ hour: 5, minute: 30 }))).toBe('fajr');
  });

  it('returns duha between sunrise and asr', () => {
    expect(resolvePrayerPeriod(times, moment(base).set({ hour: 10, minute: 0 }))).toBe('duha');
  });

  it('returns asr between asr and maghrib', () => {
    expect(resolvePrayerPeriod(times, moment(base).set({ hour: 16, minute: 0 }))).toBe('asr');
  });

  it('returns isha after maghrib', () => {
    expect(resolvePrayerPeriod(times, moment(base).set({ hour: 20, minute: 0 }))).toBe('isha');
  });
});

describe('getCurrentPrayerVariant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no location is saved', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const result = await getCurrentPrayerVariant(moment());
    expect(result).toBeNull();
  });

  it('returns null when saved location is malformed JSON', async () => {
    AsyncStorage.getItem.mockImplementation((key) =>
      Promise.resolve(key === '@prayer_location' ? 'not-json' : null)
    );
    const result = await getCurrentPrayerVariant(moment());
    expect(result).toBeNull();
  });

  it('returns null when location lacks coordinates', async () => {
    AsyncStorage.getItem.mockImplementation((key) =>
      Promise.resolve(key === '@prayer_location' ? JSON.stringify({ city: 'X' }) : null)
    );
    const result = await getCurrentPrayerVariant(moment());
    expect(result).toBeNull();
  });

  it('resolves a variant from a saved location', async () => {
    AsyncStorage.getItem.mockImplementation((key) =>
      Promise.resolve(
        key === '@prayer_location'
          ? JSON.stringify({ latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' })
          : null
      )
    );
    const result = await getCurrentPrayerVariant(moment());
    expect(THEME_VARIANT_KEYS).toContain(result);
  });
});
