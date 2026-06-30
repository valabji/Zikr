export const DEFAULT_MENU_CONFIG = [
  { id: 'quran', visible: true },
  { id: 'books', visible: true },
  { id: 'radio', visible: true },
  { id: 'tasbih', visible: true },
  { id: 'azkar', visible: true },
  { id: 'prayerTimes', visible: true },
  { id: 'qibla', visible: true },
  { id: 'islamicCalendar', visible: true },
  { id: 'wirdPlanner', visible: true },
  { id: 'hifzTracker', visible: true },
  { id: 'about', visible: true },
  { id: 'language', visible: true },
];

export const ITEM_DEFS = {
  quran:           { labelKey: 'navigation.quran',           icon: 'book-open',  testID: 'quran-screen' },
  books:           { labelKey: 'navigation.books',           icon: 'book',       testID: 'books-screen' },
  radio:           { labelKey: 'navigation.radio',           icon: 'radio',      testID: 'radio-screen' },
  tasbih:          { labelKey: 'app.tasbih',                 icon: 'target',     testID: 'screen3' },
  azkar:           { labelKey: 'navigation.azkar',           icon: 'list',       testID: 'main-screen' },
  prayerTimes:     { labelKey: 'navigation.prayerTimes',     icon: 'clock',      testID: 'prayer-times-screen' },
  qibla:           { labelKey: 'navigation.qibla',           icon: 'compass',    testID: 'qibla-screen' },
  islamicCalendar: { labelKey: 'navigation.islamicCalendar', icon: 'calendar',   testID: 'islamic-calendar-screen-link' },
  wirdPlanner:     { labelKey: 'navigation.wirdPlanner',     icon: 'book-open',  testID: 'wird-planner-screen-link' },
  hifzTracker:     { labelKey: 'navigation.hifzTracker',     icon: 'bookmark',   testID: 'hifz-tracker-screen-link' },
  about:           { labelKey: 'navigation.about',           icon: 'info',       testID: 'about-screen' },
  language:        { labelKey: 'language.switch',            icon: 'globe',      testID: undefined },
};
