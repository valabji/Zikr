import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

export function usePrayerSettings() {
  const [location, setLocation] = useState(null);
  const [calculationMethod, setCalculationMethod] = useState(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState(PRAYER_CONSTANTS.DEFAULT_MADHAB);

  const loadPrayerSettings = useCallback(async () => {
    const [savedLocation, savedMethod, savedMadhab] = await Promise.all([
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD),
      AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB),
    ]);
    const parsedLocation = savedLocation ? JSON.parse(savedLocation) : null;
    if (parsedLocation) setLocation(parsedLocation);
    if (savedMethod) setCalculationMethod(savedMethod);
    if (savedMadhab) setMadhab(savedMadhab);
    return {
      location: parsedLocation,
      calculationMethod: savedMethod,
      madhab: savedMadhab,
      complete: !!(parsedLocation && savedMethod && savedMadhab),
    };
  }, []);

  return {
    location, setLocation,
    calculationMethod, setCalculationMethod,
    madhab, setMadhab,
    loadPrayerSettings,
  };
}
