// Constants for Prayer Times and Qibla features
import { FONT_FAMILY } from './Fonts';

export const PRAYER_CONSTANTS = {
  // API URLs
  IPINFO_URL: 'https://ipinfo.io/json',
  
  // Prayer names
  PRAYER_NAMES: {
    fajr: 'fajr',
    sunrise: 'sunrise', 
    dhuhr: 'dhuhr',
    asr: 'asr',
    maghrib: 'maghrib',
    isha: 'isha'
  },

  // Calculation methods
  CALCULATION_METHODS: {
    MUSLIM_WORLD_LEAGUE: 'MuslimWorldLeague',
    EGYPTIAN: 'Egyptian',
    KARACHI: 'Karachi',
    UMM_AL_QURA: 'UmmAlQura',
    DUBAI: 'Dubai',
    MOONSIGHTING_COMMITTEE: 'MoonsightingCommittee',
    NORTH_AMERICA: 'NorthAmerica',
    KUWAIT: 'Kuwait',
    QATAR: 'Qatar',
    SINGAPORE: 'Singapore'
  },

  // Default calculation method
  DEFAULT_CALCULATION_METHOD: 'MuslimWorldLeague',

  // Madhab options
  MADHAB: {
    SHAFI: 'Shafi',
    HANAFI: 'Hanafi'
  },

  // Default madhab
  DEFAULT_MADHAB: 'Shafi',

  // Location search settings
  LOCATION_SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_RESULTS: 8
  },

  // Qibla direction - Kaaba coordinates
  KAABA_COORDINATES: {
    latitude: 21.4225,
    longitude: 39.8262
  },

  // Default locations for fallback
  DEFAULT_LOCATIONS: [
    { name: 'Mecca, Saudi Arabia', latitude: 21.4225, longitude: 39.8262, country: 'Saudi Arabia' },
    { name: 'Medina, Saudi Arabia', latitude: 24.4677, longitude: 39.6142, country: 'Saudi Arabia' },
    { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357, country: 'Egypt' },
    { name: 'Istanbul, Turkey', latitude: 41.0082, longitude: 28.9784, country: 'Turkey' },
    { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708, country: 'UAE' }
  ],

  // Storage keys
  STORAGE_KEYS: {
    LOCATION: '@prayer_location',
    CALCULATION_METHOD: '@prayer_calculation_method',
    MADHAB: '@prayer_madhab',
    NOTIFICATIONS_ENABLED: '@prayer_notifications_enabled',
    NOTIFICATION_TIMES: '@prayer_notification_times'
  },

  // Styling constants
  SPACING: {
    CONTAINER_PADDING: 20,
    CARD_MARGIN: 15,
    CARD_PADDING: 20,
    BUTTON_PADDING: 15,
    SMALL_PADDING: 10,
    TINY_PADDING: 5
  },

  BORDER_RADIUS: {
    LARGE: 15,
    MEDIUM: 10,
    SMALL: 8
  },

  FONT_SIZES: {
    TITLE: 24,
    SUBTITLE: 20,
    BODY: 16,
    SMALL_BODY: 14,
    CAPTION: 12,
    PRAYER_TIME: 18,
    QIBLA_DEGREE: 28
  },

  // Font styles that include both size and family
  FONT_STYLES: {
    TITLE: { fontSize: 24, fontFamily: FONT_FAMILY },
    SUBTITLE: { fontSize: 20, fontFamily: FONT_FAMILY },
    BODY: { fontSize: 16, fontFamily: FONT_FAMILY },
    SMALL_BODY: { fontSize: 14, fontFamily: FONT_FAMILY },
    CAPTION: { fontSize: 12, fontFamily: FONT_FAMILY },
    PRAYER_TIME: { fontSize: 18, fontFamily: FONT_FAMILY },
    QIBLA_DEGREE: { fontSize: 28, fontFamily: FONT_FAMILY }
  },

  // Animation constants
  ANIMATION: {
    COMPASS_ROTATION_DURATION: 1000,
    PRAYER_UPDATE_INTERVAL: 60000, // 1 minute
    LOCATION_TIMEOUT: 15000 // 15 seconds
  }
};
