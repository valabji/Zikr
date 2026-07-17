import moment from 'moment-hijri';
import { ISLAMIC_CALENDAR_CONSTANTS } from '@/constants/IslamicCalendarConstants';
import { getCurrentLanguage } from '@/locales/i18n';

const AR_HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

function hijriMonthName(iMonthIndex, lang) {
  return lang === 'ar' ? AR_HIJRI_MONTHS[iMonthIndex] : moment().locale('en').iMonth(iMonthIndex).format('iMMMM');
}

export function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function toHijri(date = new Date(), lang = getCurrentLanguage()) {
  const m = moment(date).locale('en');
  return {
    iYear: m.iYear(),
    iMonth: m.iMonth(),
    iDay: m.iDate(),
    iMonthName: hijriMonthName(m.iMonth(), lang),
  };
}

export function formatHijriDate(date = new Date(), lang = getCurrentLanguage()) {
  const m = moment(date).locale('en');
  return `${m.iDate()} ${hijriMonthName(m.iMonth(), lang)} ${m.iYear()}`;
}

export function getHijriMonthGrid(iYear, iMonth, lang = getCurrentLanguage()) {
  const monthStart = moment().locale('en').iYear(iYear).iMonth(iMonth).iDate(1).startOf('day');
  const daysInMonth = monthStart.iDaysInMonth();
  const leading = monthStart.day();
  const today = dateKey(new Date());

  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const cellMoment = moment().locale('en').iYear(iYear).iMonth(iMonth).iDate(d);
    const cellDate = cellMoment.toDate();
    cells.push({
      date: cellDate,
      key: dateKey(cellDate),
      iDay: d,
      gregorianDay: cellMoment.date(),
      isToday: dateKey(cellDate) === today,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return {
    iYear,
    iMonth,
    monthName: hijriMonthName(iMonth, lang),
    daysInMonth,
    weeks,
  };
}

export function addHijriMonths(iYear, iMonth, delta) {
  const m = moment().locale('en').iYear(iYear).iMonth(iMonth).iDate(1).add(delta, 'iMonth');
  return { iYear: m.iYear(), iMonth: m.iMonth() };
}

export function getNextOccurrence(iMonth, iDay, fromDate = new Date()) {
  const from = moment(fromDate).locale('en').startOf('day');
  const fromHijri = toHijri(fromDate);
  let candidate = moment().locale('en').iYear(fromHijri.iYear).iMonth(iMonth).iDate(iDay).startOf('day');
  if (candidate.isBefore(from)) {
    candidate = moment().locale('en').iYear(fromHijri.iYear + 1).iMonth(iMonth).iDate(iDay).startOf('day');
  }
  return {
    date: candidate.toDate(),
    daysRemaining: candidate.diff(from, 'days'),
  };
}

export function getUpcomingEvents(fromDate = new Date()) {
  return ISLAMIC_CALENDAR_CONSTANTS.SIGNIFICANT_EVENTS
    .map((event) => ({ ...event, ...getNextOccurrence(event.iMonth, event.iDay, fromDate) }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function isWithinRamadan(date = new Date()) {
  return toHijri(date).iMonth === ISLAMIC_CALENDAR_CONSTANTS.RAMADAN_IMONTH;
}

export function getRamadanRange(iYear) {
  const start = moment().locale('en').iYear(iYear).iMonth(ISLAMIC_CALENDAR_CONSTANTS.RAMADAN_IMONTH).iDate(1).startOf('day');
  const daysInMonth = start.iDaysInMonth();
  return { start: start.toDate(), daysInMonth };
}
