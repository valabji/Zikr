import { useState, useRef } from 'react';
import { Platform, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { t } from '@/locales/i18n';
import { calculateHeading, shortestRotationTarget } from '@/utils/compassMath';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';

const QIBLA_PERMISSION_DISMISSED_KEY = 'qibla_location_permission_dismissed';

export const useQiblaCompass = () => {
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [compassMethod, setCompassMethod] = useState('');
  const [compassAccuracy, setCompassAccuracy] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [forceMethod, setForceMethod] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [usingGpsLocation, setUsingGpsLocation] = useState(false);

  const compassRotationValue = useRef(new Animated.Value(0)).current;
  const magnetometerSubscription = useRef(null);
  const headingSubscription = useRef(null);
  const lastHeadingUpdate = useRef(0);
  const headingThrottle = 50;

  const animateCompassRotation = (targetAngle) => {
    Animated.timing(compassRotationValue, {
      toValue: shortestRotationTarget(compassRotationValue._value, targetAngle),
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const throttled = () => {
    const now = Date.now();
    if (now - lastHeadingUpdate.current < headingThrottle) return true;
    lastHeadingUpdate.current = now;
    return false;
  };

  const ensureLocationPermission = async () => {
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    if (currentStatus === 'granted') return true;

    // Only show the custom dialog when a saved location proves initial setup is done
    const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    if (savedLocation) {
      const dontShowAgain = await AsyncStorage.getItem(QIBLA_PERMISSION_DISMISSED_KEY);
      if (!dontShowAgain) {
        const userChoice = await new Promise((resolve) => {
          Alert.alert(
            t('qibla.locationPermissionTitle'),
            t('qibla.locationPermissionMessage'),
            [
              {
                text: t('qibla.dontShowAgain'),
                onPress: async () => {
                  await AsyncStorage.setItem(QIBLA_PERMISSION_DISMISSED_KEY, 'true');
                  resolve('dismiss');
                },
                style: 'destructive',
              },
              { text: t('qibla.noThanks'), onPress: () => resolve('decline'), style: 'cancel' },
              { text: t('qibla.allowLocation'), onPress: () => resolve('allow'), style: 'default' },
            ]
          );
        });
        if (userChoice !== 'allow') return false;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const acquireGpsLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      setGpsLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        city: t('qibla.gpsLocationName'),
        country: t('qibla.currentPosition'),
      });
      setUsingGpsLocation(true);
    } catch (locationError) {
      setUsingGpsLocation(false);
    }
  };

  const setupLocationHeading = async (useTrueHeading) => {
    if (Platform.OS === 'web') return false;

    try {
      if (!(await ensureLocationPermission())) return false;
      if (!(await Location.hasServicesEnabledAsync())) return false;

      await acquireGpsLocation();

      const methodLabel = useTrueHeading ? t('qibla.methodGps') : t('qibla.methodGpsMagneticEnhanced');
      headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
        if (throttled()) return;
        // trueHeading is -1 when unavailable
        if (useTrueHeading && headingData.trueHeading === -1) return;
        const heading = useTrueHeading ? headingData.trueHeading : headingData.magHeading;
        setCurrentHeading(heading);
        setCompassMethod(methodLabel);
        setCompassAccuracy(headingData.accuracy || null);
        animateCompassRotation(-heading);
      });

      setCompassEnabled(true);
      setCompassMethod(methodLabel);
      setCompassAccuracy(t('qibla.initializing'));
      return { gpsLocation };
    } catch (error) {
      console.error('Error setting up location heading:', error);
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }
  };

  const setupMagnetometer = async () => {
    if (Platform.OS === 'web') {
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }

    try {
      const { status } = await Magnetometer.requestPermissionsAsync();
      const isAvailable = status === 'granted' && (await Magnetometer.isAvailableAsync());
      if (!isAvailable) {
        setCompassEnabled(false);
        setCompassMethod(t('qibla.methodUnavailable'));
        setCompassAccuracy(null);
        return false;
      }

      setCompassEnabled(true);
      setCompassMethod(t('qibla.methodMagnetometer'));
      setCompassAccuracy(t('qibla.accuracyLow'));

      Magnetometer.setUpdateInterval(150);
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        if (throttled()) return;
        const heading = calculateHeading(data.x, data.y);
        setCurrentHeading(heading);
        animateCompassRotation(-heading);
      });

      return true;
    } catch (error) {
      console.error('Error setting up magnetometer:', error);
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }
  };

  const cleanupCompass = () => {
    if (headingSubscription.current) {
      headingSubscription.current.remove();
      headingSubscription.current = null;
    }
    if (magnetometerSubscription.current) {
      magnetometerSubscription.current.remove();
      magnetometerSubscription.current = null;
    }
  };

  const checkAvailableMethods = async () => {
    if (Platform.OS === 'web') return [];
    const methods = [];

    try {
      if (await Location.hasServicesEnabledAsync()) {
        methods.push('trueHeading', 'magHeading');
      }
    } catch (error) {}

    try {
      if (await Magnetometer.isAvailableAsync()) {
        methods.push('magnetometer');
      }
    } catch (error) {}

    return methods;
  };

  const initializeCompass = async () => {
    setCompassEnabled(false);
    setCompassMethod('');
    setCompassAccuracy(null);

    try {
      const methods = await checkAvailableMethods();
      setAvailableMethods(methods);

      if (forceMethod === 'trueHeading' && methods.includes('trueHeading')) {
        return await setupLocationHeading(true);
      }
      if (forceMethod === 'magHeading' && methods.includes('magHeading')) {
        return await setupLocationHeading(false);
      }
      if (forceMethod === 'magnetometer' && methods.includes('magnetometer')) {
        return await setupMagnetometer();
      }

      if (methods.includes('magHeading')) {
        const result = await setupLocationHeading(false);
        if (result) return result;
      }
      if (methods.includes('trueHeading')) {
        const result = await setupLocationHeading(true);
        if (result) return result;
      }
      if (methods.includes('magnetometer')) {
        const result = await setupMagnetometer();
        if (result) return result;
      }

      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    } catch (error) {
      console.error('Error initializing compass:', error);
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }
  };

  const swapCompassMethod = async (method) => {
    cleanupCompass();
    setForceMethod(method);

    if (method === 'trueHeading' || method === 'magHeading') {
      // Explicitly choosing a location method resets the "don't show again" preference
      await AsyncStorage.removeItem(QIBLA_PERMISSION_DISMISSED_KEY);
      return await setupLocationHeading(method === 'trueHeading');
    }
    if (method === 'magnetometer') {
      return await setupMagnetometer();
    }
    if (method === 'auto') {
      setForceMethod(null);
      return await initializeCompass();
    }
  };

  return {
    compassEnabled,
    currentHeading,
    compassMethod,
    compassAccuracy,
    availableMethods,
    gpsLocation,
    usingGpsLocation,
    compassRotationValue,
    initializeCompass,
    cleanupCompass,
    swapCompassMethod,
    checkAvailableMethods
  };
};
