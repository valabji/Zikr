import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { t } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { searchLocations, getLocationFromIP, getBrowserLocation } from '@/utils/prayer/PrayerUtils';

export function useLocationSearch(onSelect) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(searchTimeoutRef.current), []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(searchTimeoutRef.current);

    if (query.length < PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        const uniqueResults = results.filter((item, index, self) =>
          index === self.findIndex((r) => r.name === item.name && r.country === item.country)
        );
        setSearchResults(uniqueResults);
      } catch (error) {
        Alert.alert(t('locationSettings.error'), t('locationSettings.searchError'));
      } finally {
        setIsSearching(false);
      }
    }, PRAYER_CONSTANTS.LOCATION_SEARCH.DEBOUNCE_DELAY);
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (Platform.OS === 'web') {
        try {
          const browserLocation = await getBrowserLocation();
          if (browserLocation) {
            onSelect(browserLocation);
            return;
          }
        } catch (error) {
          console.warn('Browser geolocation failed:', error);
        }
      }

      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('locationSettings.permissionDenied'), t('locationSettings.permissionDeniedMessage'));
          return;
        }

        try {
          const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: PRAYER_CONSTANTS.ANIMATION.LOCATION_TIMEOUT,
          });
          const geocoded = await Location.reverseGeocodeAsync({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          });
          onSelect({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
            city: geocoded[0]?.city || 'Unknown',
            region: geocoded[0]?.region || 'Unknown',
            country: geocoded[0]?.country || 'Unknown',
            timezone: moment.tz.guess(),
          });
          return;
        } catch (locationError) {
          console.warn('Expo location failed:', locationError);
        }
      }

      onSelect(await getLocationFromIP());
    } catch (error) {
      Alert.alert(t('locationSettings.error'), t('locationSettings.gpsError'));
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getIPLocation = async () => {
    setIsGettingLocation(true);
    try {
      onSelect(await getLocationFromIP());
    } catch (error) {
      Alert.alert(t('locationSettings.error'), t('locationSettings.ipLocationError'));
    } finally {
      setIsGettingLocation(false);
    }
  };

  return { searchQuery, searchResults, isSearching, isGettingLocation, handleSearch, getCurrentLocation, getIPLocation };
}
