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

export const DEFAULT_MUSHAF_EDITION = 'v1';

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
    viewMode: 'paged',
    customLineSize: false,
  },
};

export const FONT_SCALE_RANGE = { min: 0.75, max: 3.0, step: 0.05, default: 1.0 };

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
};
