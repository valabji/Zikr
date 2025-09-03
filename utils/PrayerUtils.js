import { Coordinates, PrayerTimes, CalculationMethod, Madhab } from 'adhan';
import moment from 'moment-timezone';
import { Platform } from 'react-native';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

/**
 * Calculate Qibla direction from given coordinates
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {number} Qibla direction in degrees
 */
export const calculateQiblaDirection = (latitude, longitude) => {
  const { KAABA_COORDINATES } = PRAYER_CONSTANTS;
  
  const lat1 = latitude * (Math.PI / 180);
  const lat2 = KAABA_COORDINATES.latitude * (Math.PI / 180);
  const deltaLon = (KAABA_COORDINATES.longitude - longitude) * (Math.PI / 180);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;

  return Math.round(bearing * 10) / 10; // Round to 1 decimal place
};

/**
 * Get calculation method from string
 * @param {string} methodName - Method name
 * @returns {Object} Calculation method object
 */
export const getCalculationMethod = (methodName) => {
  switch (methodName) {
    case PRAYER_CONSTANTS.CALCULATION_METHODS.EGYPTIAN:
      return CalculationMethod.Egyptian();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.KARACHI:
      return CalculationMethod.Karachi();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.UMM_AL_QURA:
      return CalculationMethod.UmmAlQura();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.DUBAI:
      return CalculationMethod.Dubai();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.MOONSIGHTING_COMMITTEE:
      return CalculationMethod.MoonsightingCommittee();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.NORTH_AMERICA:
      return CalculationMethod.NorthAmerica();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.KUWAIT:
      return CalculationMethod.Kuwait();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.QATAR:
      return CalculationMethod.Qatar();
    case PRAYER_CONSTANTS.CALCULATION_METHODS.SINGAPORE:
      return CalculationMethod.Singapore();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
};

/**
 * Get madhab from string
 * @param {string} madhabName - Madhab name
 * @returns {string} Madhab constant
 */
export const getMadhab = (madhabName) => {
  return madhabName === PRAYER_CONSTANTS.MADHAB.HANAFI ? Madhab.Hanafi : Madhab.Shafi;
};

/**
 * Calculate prayer times for given location and date
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {string} timezone - Timezone string
 * @param {Date} date - Date for calculation
 * @param {string} calculationMethod - Calculation method
 * @param {string} madhab - Madhab
 * @returns {Object} Prayer times object
 */
export const calculatePrayerTimes = (latitude, longitude, timezone, date = new Date(), calculationMethod = PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD, madhab = PRAYER_CONSTANTS.DEFAULT_MADHAB) => {
  try {
    const coordinates = new Coordinates(latitude, longitude);
    const params = getCalculationMethod(calculationMethod);
    params.madhab = getMadhab(madhab);

    const prayerTimes = new PrayerTimes(coordinates, date, params);
    
    // Convert times to moment objects with timezone
    const times = {
      fajr: moment(prayerTimes.fajr).tz(timezone),
      sunrise: moment(prayerTimes.sunrise).tz(timezone),
      dhuhr: moment(prayerTimes.dhuhr).tz(timezone),
      asr: moment(prayerTimes.asr).tz(timezone),
      maghrib: moment(prayerTimes.maghrib).tz(timezone),
      isha: moment(prayerTimes.isha).tz(timezone)
    };

    return times;
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
};

/**
 * Get current and next prayer
 * @param {Object} prayerTimes - Prayer times object
 * @param {number} latitude - Latitude for tomorrow's calculation
 * @param {number} longitude - Longitude for tomorrow's calculation  
 * @param {string} timezone - Timezone for tomorrow's calculation
 * @param {string} calculationMethod - Calculation method for tomorrow's calculation
 * @param {string} madhab - Madhab for tomorrow's calculation
 * @returns {Object} Current and next prayer info
 */
export const getCurrentAndNextPrayer = (prayerTimes, latitude, longitude, timezone, calculationMethod = PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD, madhab = PRAYER_CONSTANTS.DEFAULT_MADHAB) => {
  if (!prayerTimes) return { current: null, next: null };

  const now = moment();
  const prayers = [
    { name: 'fajr', time: prayerTimes.fajr },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'isha', time: prayerTimes.isha }
  ];

  let current = null;
  let next = null;

  // Check if we're before Fajr
  if (now.isBefore(prayers[0].time)) {
    next = prayers[0];
    return { current, next };
  }

  // Check if we're after Isha - get tomorrow's Fajr
  if (now.isAfter(prayers[prayers.length - 1].time)) {
    current = prayers[prayers.length - 1];
    // Calculate tomorrow's prayer times to get next Fajr
    if (latitude && longitude && timezone) {
      const tomorrow = moment().add(1, 'day').toDate();
      const tomorrowPrayerTimes = calculatePrayerTimes(latitude, longitude, timezone, tomorrow, calculationMethod, madhab);
      if (tomorrowPrayerTimes && tomorrowPrayerTimes.fajr) {
        next = { name: 'fajr', time: tomorrowPrayerTimes.fajr };
      }
    }
    return { current, next };
  }

  // Find current prayer period
  for (let i = 0; i < prayers.length - 1; i++) {
    if (now.isAfter(prayers[i].time) && now.isBefore(prayers[i + 1].time)) {
      current = prayers[i];
      next = prayers[i + 1];
      break;
    }
  }

  return { current, next };
};

/**
 * Get time remaining until next prayer
 * @param {moment} nextPrayerTime - Next prayer time
 * @returns {string} Formatted time remaining
 */
export const getTimeUntilNextPrayer = (nextPrayerTime) => {
  if (!nextPrayerTime) return '';

  const now = moment();
  const diff = nextPrayerTime.diff(now);
  
  // Return empty string if time has passed
  if (diff <= 0) return '';

  const duration = moment.duration(diff);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    // Less than a minute remaining
    const seconds = duration.seconds();
    return seconds > 0 ? `${seconds}s` : '';
  }
};

/**
 * Format prayer time for display
 * @param {moment} time - Prayer time
 * @param {boolean} use24Hour - Use 24-hour format
 * @returns {string} Formatted time string
 */
export const formatPrayerTime = (time, use24Hour = false) => {
  if (!time) return '';
  return time.format(use24Hour ? 'HH:mm' : 'h:mm A');
};

/**
 * Get location info from IP
 * @returns {Promise<Object>} Location info
 */
export const getLocationFromIP = async () => {
  try {
    const response = await fetch(PRAYER_CONSTANTS.IPINFO_URL);
    const data = await response.json();
    
    if (data.loc) {
      const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));
      return {
        latitude,
        longitude,
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone
      };
    }
    throw new Error('Location not found in response');
  } catch (error) {
    console.error('Error getting location from IP:', error);
    throw error;
  }
};

/**
 * Search for locations using OpenStreetMap Nominatim API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of location results
 */
export const searchLocations = async (query) => {
  if (query.length < PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH) {
    return [];
  }

  try {
    // Use OpenStreetMap Nominatim API (free, no API key required)
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=${PRAYER_CONSTANTS.LOCATION_SEARCH.MAX_RESULTS}&q=${encodedQuery}&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error('Nominatim API failed');
    }

    const data = await response.json();
    
    const locations = data.map(item => {
      // Extract city and country from the address components
      const address = item.address || {};
      let city = address.city || address.town || address.village || address.hamlet || item.display_name.split(',')[0];
      let country = address.country || 'Unknown';
      
      // Clean up display name - prioritize city names
      let displayName = `${city}, ${country}`;
      
      // If we have a more specific location type, use it
      if (address.suburb || address.neighbourhood) {
        displayName = `${address.suburb || address.neighbourhood}, ${city}, ${country}`;
      }

      return {
        name: displayName,
        city: city,
        country: country,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        timezone: moment.tz.guess(), // Fallback to device timezone
        importance: item.importance || 0 // OpenStreetMap provides importance score
      };
    });

    // Filter out invalid coordinates and sort by importance
    const validLocations = locations
      .filter(loc => 
        !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
        Math.abs(loc.latitude) <= 90 && Math.abs(loc.longitude) <= 180
      )
      .sort((a, b) => {
        // First prioritize exact city name matches
        const queryLower = query.toLowerCase();
        const aExactMatch = a.city.toLowerCase() === queryLower;
        const bExactMatch = b.city.toLowerCase() === queryLower;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Then sort by importance (higher importance first)
        return (b.importance || 0) - (a.importance || 0);
      });

    return validLocations;

  } catch (error) {
    // Fallback to default locations if API fails
    const filtered = PRAYER_CONSTANTS.DEFAULT_LOCATIONS.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, PRAYER_CONSTANTS.LOCATION_SEARCH.MAX_RESULTS);
  }
};

/**
 * Get current location using browser geolocation API (web) or return null
 * @returns {Promise<Object|null>} Location data or null
 */
export const getBrowserLocation = async () => {
  if (Platform.OS !== 'web' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get city name from reverse geocoding or IP
          try {
            const ipLocation = await getLocationFromIP();
            resolve({
              latitude,
              longitude,
              city: ipLocation.city || 'Unknown',
              region: ipLocation.region || 'Unknown',
              country: ipLocation.country || 'Unknown',
              timezone: ipLocation.timezone || moment.tz.guess(),
              name: `${ipLocation.city || 'Current Location'}, ${ipLocation.country || 'Unknown'}`
            });
          } catch (error) {
            resolve({
              latitude,
              longitude,
              city: 'Current Location',
              region: 'Unknown',
              country: 'Unknown',
              timezone: moment.tz.guess(),
              name: 'Current Location'
            });
          }
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: PRAYER_CONSTANTS.ANIMATION.LOCATION_TIMEOUT,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
};

/**
 * Get compass direction text
 * @param {number} degrees - Degrees
 * @returns {string} Direction text
 */
export const getCompassDirection = (degrees) => {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};
