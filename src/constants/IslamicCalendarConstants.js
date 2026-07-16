export const ISLAMIC_CALENDAR_CONSTANTS = {
  STORAGE_KEYS: {
    FASTING_TRACKER: '@fasting_tracker',
    NOTIFICATIONS_ENABLED: '@islamic_calendar_notifications_enabled',
  },

  // iMonth is 0-indexed (0 = Muharram ... 11 = Dhul Hijjah), matching moment-hijri's convention.
  SIGNIFICANT_EVENTS: [
    { key: 'islamicNewYear', iMonth: 0, iDay: 1 },
    { key: 'ashura', iMonth: 0, iDay: 10 },
    { key: 'mawlid', iMonth: 2, iDay: 12 },
    { key: 'ramadanStart', iMonth: 8, iDay: 1 },
    { key: 'laylatAlQadr', iMonth: 8, iDay: 27 },
    { key: 'eidAlFitr', iMonth: 9, iDay: 1 },
    { key: 'arafahDay', iMonth: 11, iDay: 9 },
    { key: 'eidAlAdha', iMonth: 11, iDay: 10 },
  ],

  RAMADAN_IMONTH: 8,
  SUHOOR_OFFSET_MINUTES: 30,
};
