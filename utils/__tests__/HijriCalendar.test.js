jest.mock('../../locales/i18n', () => ({ getCurrentLanguage: () => 'en' }));

import {
  dateKey,
  toHijri,
  formatHijriDate,
  getHijriMonthGrid,
  addHijriMonths,
  getNextOccurrence,
  getUpcomingEvents,
  isWithinRamadan,
  getRamadanRange,
} from '../HijriCalendar';

describe('HijriCalendar', () => {
  it('dateKey formats a date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 1, 18))).toBe('2026-02-18');
  });

  it('toHijri converts a known Gregorian date to Hijri', () => {
    const hijri = toHijri(new Date(2026, 1, 18));
    expect(hijri.iYear).toBe(1447);
    expect(hijri.iMonth).toBe(8);
    expect(hijri.iDay).toBe(1);
  });

  it('formatHijriDate returns a non-empty string with English numerals', () => {
    const formatted = formatHijriDate(new Date(2026, 1, 18));
    expect(formatted).toMatch(/1447/);
  });

  it('getHijriMonthGrid produces full weeks covering the whole month', () => {
    const grid = getHijriMonthGrid(1447, 8);
    expect(grid.iYear).toBe(1447);
    expect(grid.iMonth).toBe(8);
    const allCells = grid.weeks.flat();
    const dayCells = allCells.filter(Boolean);
    expect(dayCells.length).toBe(grid.daysInMonth);
    expect(allCells.length % 7).toBe(0);
  });

  it('getHijriMonthGrid marks today', () => {
    const today = new Date();
    const hijriToday = toHijri(today);
    const grid = getHijriMonthGrid(hijriToday.iYear, hijriToday.iMonth);
    const todayCell = grid.weeks.flat().find((c) => c && c.isToday);
    expect(todayCell).toBeTruthy();
    expect(todayCell.iDay).toBe(hijriToday.iDay);
  });

  it('addHijriMonths advances across a year boundary', () => {
    const next = addHijriMonths(1447, 11, 1);
    expect(next.iYear).toBe(1448);
    expect(next.iMonth).toBe(0);
  });

  it('addHijriMonths goes backward across a year boundary', () => {
    const prev = addHijriMonths(1447, 0, -1);
    expect(prev.iYear).toBe(1446);
    expect(prev.iMonth).toBe(11);
  });

  it('getNextOccurrence returns 0 days remaining for today\'s date', () => {
    const today = new Date(2026, 1, 18);
    const hijri = toHijri(today);
    const result = getNextOccurrence(hijri.iMonth, hijri.iDay, today);
    expect(result.daysRemaining).toBe(0);
  });

  it('getNextOccurrence rolls forward to next year if the date already passed', () => {
    const from = new Date(2026, 5, 1);
    const fromHijri = toHijri(from);
    const result = getNextOccurrence(fromHijri.iMonth, 1, from);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('getUpcomingEvents returns 8 events sorted by daysRemaining ascending', () => {
    const events = getUpcomingEvents(new Date());
    expect(events.length).toBe(8);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].daysRemaining).toBeGreaterThanOrEqual(events[i - 1].daysRemaining);
    }
  });

  it('isWithinRamadan is true during Ramadan and false outside it', () => {
    expect(isWithinRamadan(new Date(2026, 1, 18))).toBe(true);
    expect(isWithinRamadan(new Date(2026, 5, 1))).toBe(false);
  });

  it('getRamadanRange returns a start date and day count for the given Hijri year', () => {
    const range = getRamadanRange(1447);
    expect(range.daysInMonth).toBeGreaterThanOrEqual(29);
    expect(range.daysInMonth).toBeLessThanOrEqual(30);
    expect(dateKey(range.start)).toBe('2026-02-18');
  });
});
