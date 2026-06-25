export const MUSHAF_EDITIONS = [
  {
    id: 'v1',
    year: 1405,
    qcfVersion: 'v1',
    layoutFile: 'pages_lines_v1',
  },
  {
    id: 'v2',
    year: 1421,
    qcfVersion: 'v2',
    layoutFile: 'pages_lines_v2',
  },
  {
    id: 'v2-1441',
    year: 1441,
    qcfVersion: 'v2',
    layoutFile: 'pages_lines_v2',
  },
];

export const DEFAULT_MUSHAF_EDITION = 'v2';

export function getMushafEdition(id) {
  return MUSHAF_EDITIONS.find((m) => m.id === id) || MUSHAF_EDITIONS[0];
}

export const QURAN_CONSTANTS = {
  TOTAL_PAGES: 604,
  SURAH_COUNT: 114,
  JUZ_COUNT: 30,

  STORAGE_KEYS: {
    LAST_PAGE: '@quran_last_page',
    BOOKMARKS: '@quran_bookmarks',
    SETTINGS: '@quran_settings',
    READING_PROGRESS: '@quran_reading_progress',
  },

  FONT_FAMILY: 'UthmanicHafs',

  DEFAULT_SETTINGS: {
    showTranslation: false,
    showTafsir: false,
    showWBW: false,
    fontScale: 1.0,
    reciterId: null,
    mushafEdition: DEFAULT_MUSHAF_EDITION,
    ayahInteractionMode: 'menu',
    audioPlaybackScope: 'ayah',
    loopEnabled: false,
    playbackRate: 1.0,
    viewMode: 'paged',
    customLineSize: false,
    tafsirId: 'muyassar_ar',
  },
};

export const FONT_SCALE_RANGE = { min: 0.75, max: 3.0, step: 0.05, default: 1.0 };

export const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5];

// Base font size (px) used when customLineSize is on. The font-size slider
// multiplies this instead of the auto-fitted Mushaf line size, and lines are
// allowed to wrap, so the reader can show larger text than the printed
// Mushaf width otherwise permits.
export const CUSTOM_LINE_BASE_FONT_SIZE = 24;

export const VIEW_MODES = {
  PAGED: 'paged',
  CONTINUOUS: 'continuous',
};

export const AYAH_INTERACTION_MODES = {
  MENU: 'menu',
  DIRECT: 'direct',
};

export const AUDIO_PLAYBACK_SCOPES = {
  AYAH: 'ayah',
  PAGE: 'page',
  SURAH: 'surah',
  MUSHAF: 'mushaf',
};

// source:'bundle' → JSON imported at build time; source:'api' → fetched from api.quran.com on demand.
export const TAFSIRS = [
  { id: 'muyassar_ar',    nameAr: 'الميسر',               nameEn: 'al-Muyassar',          lang: 'ar', direction: 'rtl', source: 'bundle' },
  { id: 'saadi_ar',       nameAr: 'السعدي',               nameEn: "al-Saʿdi",         lang: 'ar', direction: 'rtl', source: 'bundle' },
  { id: 'baghawi_ar',     nameAr: 'البغوي',               nameEn: 'al-Baghawi',            lang: 'ar', direction: 'rtl', source: 'bundle' },
  { id: 'wasit_ar',       nameAr: 'الوسيط',               nameEn: 'al-Wasit',              lang: 'ar', direction: 'rtl', source: 'api', apiId: 93  },
  { id: 'ibn_kathir_ar',  nameAr: 'ابن كثير',             nameEn: 'Ibn Kathir',            lang: 'ar', direction: 'rtl', source: 'api', apiId: 14  },
  { id: 'tabari_ar',      nameAr: 'الطبري',               nameEn: 'al-Tabari',             lang: 'ar', direction: 'rtl', source: 'api', apiId: 15  },
  { id: 'qurtubi_ar',     nameAr: 'القرطبي',              nameEn: 'al-Qurtubi',            lang: 'ar', direction: 'rtl', source: 'api', apiId: 90  },
  { id: 'ibn_kathir_en',  nameAr: 'ابن كثير (إنجليزي)',  nameEn: 'Ibn Kathir (EN)',        lang: 'en', direction: 'ltr', source: 'api', apiId: 169 },
  { id: 'maariful_en',    nameAr: "معارف القرآن (إنجليزي)", nameEn: "Maʿariful Quran (EN)", lang: 'en', direction: 'ltr', source: 'api', apiId: 168 },
  { id: 'wahiduddin_en',  nameAr: 'الوحيدين (إنجليزي)',   nameEn: 'Wahiduddin Khan (EN)',  lang: 'en', direction: 'ltr', source: 'bundle' },
];

export const DEFAULT_TAFSIR_ID = 'muyassar_ar';
