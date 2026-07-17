import {
  calculateQiblaDirection,
  getCalculationMethod,
  getMadhab,
  calculatePrayerTimes,
  getCurrentAndNextPrayer,
  getTimeUntilNextPrayer,
  formatPrayerTime,
  getLocationFromIP,
  searchLocations,
  getBrowserLocation,
  getCompassDirection,
} from '@/utils/prayer/PrayerUtils';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { CalculationMethod, Madhab } from 'adhan';
import moment from 'moment-timezone';

describe('PrayerUtils', () => {
  describe('calculateQiblaDirection', () => {
    it('returns a bearing between 0 and 360 degrees', () => {
      const bearing = calculateQiblaDirection(40.7128, -74.006);
      expect(typeof bearing).toBe('number');
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('matches known directions from major cities (within tolerance)', () => {
      // New York → Mecca ≈ 58°
      expect(calculateQiblaDirection(40.7128, -74.006)).toBeCloseTo(58.5, 0);
      // London → Mecca ≈ 119°
      expect(calculateQiblaDirection(51.5074, -0.1278)).toBeCloseTo(118.9, 0);
      // Cairo → Mecca ≈ 136°
      expect(calculateQiblaDirection(30.0444, 31.2357)).toBeCloseTo(136.1, 0);
    });

    it('rounds to 1 decimal place', () => {
      const bearing = calculateQiblaDirection(40.7128, -74.006);
      const decimals = bearing.toString().split('.')[1];
      expect(!decimals || decimals.length <= 1).toBe(true);
    });

    it('handles equator and prime meridian (0,0)', () => {
      const bearing = calculateQiblaDirection(0, 0);
      expect(typeof bearing).toBe('number');
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('getCalculationMethod', () => {
    const { CALCULATION_METHODS } = PRAYER_CONSTANTS;

    it.each([
      ['EGYPTIAN', CALCULATION_METHODS.EGYPTIAN, CalculationMethod.Egyptian()],
      ['KARACHI', CALCULATION_METHODS.KARACHI, CalculationMethod.Karachi()],
      ['UMM_AL_QURA', CALCULATION_METHODS.UMM_AL_QURA, CalculationMethod.UmmAlQura()],
      ['DUBAI', CALCULATION_METHODS.DUBAI, CalculationMethod.Dubai()],
      ['MOONSIGHTING_COMMITTEE', CALCULATION_METHODS.MOONSIGHTING_COMMITTEE, CalculationMethod.MoonsightingCommittee()],
      ['NORTH_AMERICA', CALCULATION_METHODS.NORTH_AMERICA, CalculationMethod.NorthAmerica()],
      ['KUWAIT', CALCULATION_METHODS.KUWAIT, CalculationMethod.Kuwait()],
      ['QATAR', CALCULATION_METHODS.QATAR, CalculationMethod.Qatar()],
      ['SINGAPORE', CALCULATION_METHODS.SINGAPORE, CalculationMethod.Singapore()],
    ])('returns correct params for %s', (_label, method, expected) => {
      const result = getCalculationMethod(method);
      expect(result.fajrAngle).toBe(expected.fajrAngle);
      expect(result.ishaAngle).toBe(expected.ishaAngle);
    });

    it('falls back to MuslimWorldLeague for unknown method', () => {
      const result = getCalculationMethod('NotARealMethod');
      const expected = CalculationMethod.MuslimWorldLeague();
      expect(result.fajrAngle).toBe(expected.fajrAngle);
    });

    it('also returns MuslimWorldLeague when the explicit value is passed', () => {
      const result = getCalculationMethod(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
      const expected = CalculationMethod.MuslimWorldLeague();
      expect(result.fajrAngle).toBe(expected.fajrAngle);
    });
  });

  describe('getMadhab', () => {
    it('returns Hanafi when Hanafi is requested', () => {
      expect(getMadhab(PRAYER_CONSTANTS.MADHAB.HANAFI)).toBe(Madhab.Hanafi);
    });

    it('returns Shafi by default', () => {
      expect(getMadhab(PRAYER_CONSTANTS.MADHAB.SHAFI)).toBe(Madhab.Shafi);
      expect(getMadhab(undefined)).toBe(Madhab.Shafi);
      expect(getMadhab('something-else')).toBe(Madhab.Shafi);
    });
  });

  describe('calculatePrayerTimes', () => {
    it('returns all five prayers plus sunrise for a valid location', () => {
      const times = calculatePrayerTimes(
        40.7128,
        -74.006,
        'America/New_York',
        new Date('2025-06-15T12:00:00Z')
      );
      expect(times).not.toBeNull();
      ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((p) => {
        expect(times).toHaveProperty(p);
        expect(moment.isMoment(times[p])).toBe(true);
      });
    });

    it('respects the supplied timezone', () => {
      const times = calculatePrayerTimes(
        40.7128,
        -74.006,
        'America/New_York',
        new Date('2025-06-15T12:00:00Z')
      );
      expect(times.fajr.tz()).toBe('America/New_York');
    });

    it('returns null when the adhan library throws', () => {
      jest.isolateModules(() => {
        jest.doMock('adhan', () => ({
          Coordinates: function () { throw new Error('bad coords'); },
          PrayerTimes: function () {},
          CalculationMethod: { MuslimWorldLeague: () => ({}) },
          Madhab: { Shafi: 'shafi', Hanafi: 'hanafi' },
        }));
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // eslint-disable-next-line global-require
        const { calculatePrayerTimes: calc } = require('@/utils/prayer/PrayerUtils');
        const times = calc(40, -74, 'UTC');
        expect(times).toBeNull();
        spy.mockRestore();
      });
    });
  });

  describe('getCurrentAndNextPrayer', () => {
    const lat = 40.7128;
    const lon = -74.006;
    const tz = 'America/New_York';

    // Build a fixed prayer-times object for "today"
    const buildPrayers = (base) => ({
      fajr: moment(base).hour(5).minute(0),
      sunrise: moment(base).hour(6).minute(30),
      dhuhr: moment(base).hour(12).minute(0),
      asr: moment(base).hour(15).minute(0),
      maghrib: moment(base).hour(18).minute(0),
      isha: moment(base).hour(20).minute(0),
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns null current/next when prayerTimes is falsy', () => {
      const result = getCurrentAndNextPrayer(null, lat, lon, tz);
      expect(result).toEqual({ current: null, next: null });
    });

    it('identifies Fajr as next when before Fajr', () => {
      const base = moment('2025-06-15T03:00:00');
      jest.useFakeTimers().setSystemTime(base.toDate());
      const prayers = buildPrayers(base);
      const { current, next } = getCurrentAndNextPrayer(prayers, lat, lon, tz);
      expect(current).toBeNull();
      expect(next.name).toBe('fajr');
    });

    it('identifies the current/next pair during the day', () => {
      const base = moment('2025-06-15T13:00:00');
      jest.useFakeTimers().setSystemTime(base.toDate());
      const prayers = buildPrayers(base);
      const { current, next } = getCurrentAndNextPrayer(prayers, lat, lon, tz);
      expect(current.name).toBe('dhuhr');
      expect(next.name).toBe('asr');
    });

    it('returns isha as current and tomorrow fajr as next when after isha', () => {
      const base = moment('2025-06-15T22:00:00');
      jest.useFakeTimers().setSystemTime(base.toDate());
      const prayers = buildPrayers(base);
      const { current, next } = getCurrentAndNextPrayer(prayers, lat, lon, tz);
      expect(current.name).toBe('isha');
      expect(next).not.toBeNull();
      expect(next.name).toBe('fajr');
    });

    it('returns isha as current with null next if no location supplied after isha', () => {
      const base = moment('2025-06-15T22:00:00');
      jest.useFakeTimers().setSystemTime(base.toDate());
      const prayers = buildPrayers(base);
      const { current, next } = getCurrentAndNextPrayer(prayers, null, null, null);
      expect(current.name).toBe('isha');
      expect(next).toBeNull();
    });
  });

  describe('getTimeUntilNextPrayer', () => {
    afterEach(() => jest.useRealTimers());

    it('returns empty string when input is null', () => {
      expect(getTimeUntilNextPrayer(null)).toBe('');
      expect(getTimeUntilNextPrayer(undefined)).toBe('');
    });

    it('returns empty string when the time has already passed', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T12:00:00Z'));
      const past = moment('2025-06-15T10:00:00Z');
      expect(getTimeUntilNextPrayer(past)).toBe('');
    });

    it('formats hours and minutes when more than 1 hour out', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T10:00:00Z'));
      const target = moment('2025-06-15T12:30:00Z');
      expect(getTimeUntilNextPrayer(target)).toBe('2h 30m');
    });

    it('formats only minutes when under 1 hour', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T10:00:00Z'));
      const target = moment('2025-06-15T10:25:00Z');
      expect(getTimeUntilNextPrayer(target)).toBe('25m');
    });

    it('formats only seconds when less than 1 minute', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T10:00:00Z'));
      const target = moment('2025-06-15T10:00:30Z');
      expect(getTimeUntilNextPrayer(target)).toBe('30s');
    });
  });

  describe('formatPrayerTime', () => {
    it('returns empty string for falsy input', () => {
      expect(formatPrayerTime(null)).toBe('');
      expect(formatPrayerTime(undefined)).toBe('');
    });

    it('formats as 12-hour by default', () => {
      const t = moment('2025-06-15T13:30:00');
      expect(formatPrayerTime(t)).toMatch(/^1:30 PM$/);
    });

    it('formats as 24-hour when requested', () => {
      const t = moment('2025-06-15T13:30:00');
      expect(formatPrayerTime(t, true)).toBe('13:30');
    });
  });

  describe('getLocationFromIP', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      delete global.fetch;
    });

    it('parses lat/long and forwards city/region/country/timezone', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          loc: '40.7128,-74.0060',
          city: 'New York',
          region: 'NY',
          country: 'US',
          timezone: 'America/New_York',
        }),
      });
      const result = await getLocationFromIP();
      expect(result.latitude).toBeCloseTo(40.7128);
      expect(result.longitude).toBeCloseTo(-74.006);
      expect(result.city).toBe('New York');
      expect(result.country).toBe('US');
      expect(result.timezone).toBe('America/New_York');
    });

    it('throws when "loc" is missing from response', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ city: 'New York' }),
      });
      await expect(getLocationFromIP()).rejects.toThrow('Location not found in response');
    });

    it('propagates network errors', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      await expect(getLocationFromIP()).rejects.toThrow('network down');
    });
  });

  describe('searchLocations', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      delete global.fetch;
    });

    it('returns [] for queries shorter than MIN_QUERY_LENGTH', async () => {
      const result = await searchLocations('a');
      expect(result).toEqual([]);
    });

    it('maps Nominatim results to canonical location objects', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            display_name: 'Cairo, Egypt',
            lat: '30.0444',
            lon: '31.2357',
            address: { city: 'Cairo', country: 'Egypt' },
            importance: 0.9,
          },
        ]),
      });
      const result = await searchLocations('Cairo');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        city: 'Cairo',
        country: 'Egypt',
        latitude: 30.0444,
        longitude: 31.2357,
      });
    });

    it('prioritises exact city-name matches above importance', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            display_name: 'Cairo, IL, USA',
            lat: '37.0', lon: '-89.0',
            address: { city: 'Cairo', country: 'USA' },
            importance: 0.1,
          },
          {
            display_name: 'Cairo Heights, Egypt',
            lat: '30.1', lon: '31.3',
            address: { suburb: 'Cairo Heights', city: 'Greater Cairo', country: 'Egypt' },
            importance: 0.9,
          },
        ]),
      });
      const result = await searchLocations('Cairo');
      // The "Cairo" exact match should sort first even though the suburb has higher importance
      expect(result[0].city).toBe('Cairo');
    });

    it('filters out invalid coordinates', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { display_name: 'Bad, Place', lat: '999', lon: '0', address: {}, importance: 0.5 },
          { display_name: 'Cairo, Egypt', lat: '30', lon: '31', address: { city: 'Cairo', country: 'Egypt' }, importance: 0.5 },
        ]),
      });
      const result = await searchLocations('Cairo');
      expect(result.every((r) => Math.abs(r.latitude) <= 90 && Math.abs(r.longitude) <= 180)).toBe(true);
    });

    it('falls back to DEFAULT_LOCATIONS when the API errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('boom'));
      const result = await searchLocations('Mecca');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((l) => l.name.toLowerCase().includes('mecca'))).toBe(true);
    });

    it('falls back when response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      const result = await searchLocations('Dubai');
      expect(result.some((l) => l.country === 'UAE')).toBe(true);
    });
  });

  describe('getBrowserLocation', () => {
    it('returns null on non-web platforms', async () => {
      const result = await getBrowserLocation();
      expect(result).toBeNull();
    });
  });

  describe('getCompassDirection', () => {
    it.each([
      [0, 'N'],
      [22.5, 'NNE'],
      [45, 'NE'],
      [90, 'E'],
      [135, 'SE'],
      [180, 'S'],
      [225, 'SW'],
      [270, 'W'],
      [315, 'NW'],
      [360, 'N'], // wraps via % 16
    ])('maps %s° to %s', (degrees, expected) => {
      expect(getCompassDirection(degrees)).toBe(expected);
    });

    it('rounds to the nearest 22.5° step', () => {
      // 10° → rounds to 0° → N
      expect(getCompassDirection(10)).toBe('N');
      // 12° → rounds up to 22.5° → NNE
      expect(getCompassDirection(12)).toBe('NNE');
    });
  });
});
