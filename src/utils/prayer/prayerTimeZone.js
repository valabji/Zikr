import tzLookup from '@photostructure/tz-lookup';
import moment from 'moment-timezone';

export function normalizePrayerLocation(location) {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
    || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) return null;
  // shortcut: compact borders are approximate; use full boundary data if manual corrections become common.
  const timezone = location.timezoneOverride && moment.tz.zone(location.timezone)
    ? location.timezone : tzLookup(location.latitude, location.longitude);
  return { ...location, timezone };
}

// Adhan reads Date's local calendar fields, so pass the chosen zone's day in that form.
export function prayerDate(timezone, dayOffset = 0, now = new Date()) {
  const day = moment(now).tz(timezone).add(dayOffset, 'days');
  return new Date(day.year(), day.month(), day.date(), 12);
}
