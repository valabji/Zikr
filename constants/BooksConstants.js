const SOURCE_SHA = '70b83d6d21995bb32f8d7271cd75501be5a922a7';

export const BOOKS_CONSTANTS = {
  STORAGE_KEYS: {
    SETTINGS: '@books_settings',
    LAST_READ: '@books_last_read',
    BOOKMARKS: '@books_bookmarks',
    INSTALLED_PREFIX: '@books_installed_',
  },

  SOURCE: {
    SHA: SOURCE_SHA,
    RAW_BASE: `https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@${SOURCE_SHA}/db/by_book`,
  },

  LOCAL_DIR: 'books/',

  DEFAULT_SETTINGS: {
    fontScale: 1.0,
    showTranslation: false,
    lastBookId: null,
  },
};

export const FONT_SCALE_RANGE = { min: 0.75, max: 2.5, step: 0.05, default: 1.0 };

export const BOOK_CATEGORIES = {
  HADITH: 'hadith',
};

export const NEEDS_VERIFICATION = new Set(['qudsi40', 'shahwaliullah40']);
