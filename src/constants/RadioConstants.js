export const RADIO_CONSTANTS = {
  API_BASE: 'https://mp3quran.net/api/v3',
  CACHE_TTL_MS: 24 * 60 * 60 * 1000,
  STORAGE_KEYS: {
    SETTINGS: '@radio_settings',
    FAVORITES: '@radio_favorites',
    LAST_PLAYED: '@radio_last_played',
    CACHE: '@radio_stations_cache',
  },
  DEFAULT_SETTINGS: {
    lastStationId: null,
  },
};
