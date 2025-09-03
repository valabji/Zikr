import { useState, useEffect, useRef } from 'react';
import { Platform, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { t } from '../locales/i18n';
import { calculateQiblaDirection } from '../utils/PrayerUtils';

export const useQiblaCompass = () => {
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
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

  // Calculate heading from magnetometer data (fallback)
  const calculateHeading = (x, y, z) => {
    // For compass heading calculation using magnetometer data
    // Standard formula: heading = atan2(-x, y) for device orientation
    let heading = Math.atan2(-x, y) * (180 / Math.PI);
    
    // Normalize to 0-360 degrees
    if (heading < 0) {
      heading += 360;
    }
    
    return heading;
  };

  // Setup expo-location heading (preferred method)
  const setupLocationHeading = async () => {
    // Check if we're on web - location services work differently
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus !== 'granted') {
        // Check if there's a saved location (indicates user has completed initial setup)
        const savedLocation = await AsyncStorage.getItem('@prayer_location');
        
        // Only show the custom permission dialog if user has already set up a location
        if (savedLocation) {
          // Check if user has chosen to not show permission dialog again
          const dontShowAgain = await AsyncStorage.getItem('qibla_location_permission_dismissed');
          
          if (!dontShowAgain) {
            // Show custom permission dialog
            const userChoice = await new Promise((resolve) => {
              Alert.alert(
                t('qibla.locationPermissionTitle'),
                t('qibla.locationPermissionMessage'),
                [
                  {
                    text: t('qibla.dontShowAgain'),
                    onPress: async () => {
                      await AsyncStorage.setItem('qibla_location_permission_dismissed', 'true');
                      resolve('dismiss');
                    },
                    style: 'destructive'
                  },
                  {
                    text: t('qibla.noThanks'),
                    onPress: () => resolve('decline'),
                    style: 'cancel'
                  },
                  {
                    text: t('qibla.allowLocation'),
                    onPress: () => resolve('allow'),
                    style: 'default'
                  }
                ]
              );
            });
            
            if (userChoice === 'dismiss' || userChoice === 'decline') {
              return false;
            }
          }
        }
        
        // Request permission (either first setup or user chose to allow)
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return false;
        }
      }

      const hasCompass = await Location.hasServicesEnabledAsync();
      if (!hasCompass) {
        return false;
      }

      // Get current GPS location for more accurate Qibla calculation
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        
        const gpsCoords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          city: 'GPS Location',
          country: 'Current Position'
        };
        
        setGpsLocation(gpsCoords);
        setUsingGpsLocation(true);
        
      } catch (locationError) {
        setUsingGpsLocation(false);
      }

      // Start watching heading
      headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
        
        const heading = headingData.trueHeading !== -1 ? headingData.trueHeading : headingData.magHeading;
        setCurrentHeading(heading);
        
        // Update method and accuracy info based on actual heading data
        if (headingData.trueHeading !== -1) {
          setCompassMethod(t('qibla.methodGpsTrueHeading'));
          setCompassAccuracy(headingData.accuracy || null);
        } else {
          setCompassMethod(t('qibla.methodMagneticHeading'));
          setCompassAccuracy(headingData.accuracy || null);
        }
        
        // Smooth compass rotation
        animateCompassRotation(-heading);
      });

      // Set initial compass state - don't wait for first heading update
      setCompassEnabled(true);
      setCompassMethod(t('qibla.gpsLocation')); // Set initial method
      setCompassAccuracy('Initializing...'); // Set initial accuracy
      return { gpsLocation };
    } catch (error) {
      console.error('Error setting up location heading:', error);
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }
  };

  // Setup magnetometer (fallback method)
  const setupMagnetometer = async () => {
    // Check if we're on web - magnetometer is not available
    if (Platform.OS === 'web') {
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }

    try {
      
      const { status } = await Magnetometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setCompassEnabled(false);
        setCompassMethod(t('qibla.methodUnavailable'));
        setCompassAccuracy(null);
        return false;
      }

      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        setCompassEnabled(false);
        setCompassMethod(t('qibla.methodUnavailable'));
        setCompassAccuracy(null);
        return false;
      }

      
      // Set compass state immediately
      setCompassEnabled(true);
      setCompassMethod(t('qibla.methodMagnetometer'));
      setCompassAccuracy(t('qibla.accuracyLow'));
      
      // Set update interval (4 times per second for smooth animation)
      Magnetometer.setUpdateInterval(250);
      
      // Subscribe to magnetometer updates
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        setMagnetometerData(data);
        const heading = calculateHeading(data.x, data.y, data.z);
        setCurrentHeading(heading);
        
        // Smooth compass rotation
        animateCompassRotation(-heading); // Negative to rotate compass in correct direction
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

  // Cleanup compass sensors
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

  // Animate compass rotation smoothly
  const animateCompassRotation = (targetAngle) => {
    const currentValue = compassRotationValue._value;
    let finalAngle = targetAngle;
    
    // Handle 0-360 degree wrap around for smooth rotation
    const diff = finalAngle - currentValue;
    if (diff > 180) {
      finalAngle -= 360;
    } else if (diff < -180) {
      finalAngle += 360;
    }
    
    Animated.timing(compassRotationValue, {
      toValue: finalAngle,
      duration: 200, // Fast smooth updates
      useNativeDriver: false,
    }).start();
  };

  // Check what compass methods are available
  const checkAvailableMethods = async () => {
    const methods = [];
    
    // Check location heading availability - include it even if permission not granted
    // so we can show the permission dialog, but not on web
    try {
      if (Platform.OS !== 'web') {
        const hasServices = await Location.hasServicesEnabledAsync();
        if (hasServices) {
          methods.push('location');
        }
      }
    } catch (error) {
    }
    
    // Check magnetometer availability - not available on web
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Magnetometer.getPermissionsAsync();
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (isAvailable) {
          methods.push('magnetometer');
        }
      }
    } catch (error) {
    }
    
    return methods;
  };

  // Initialize compass (try location heading first, fallback to magnetometer)
  const initializeCompass = async () => {
    // Reset compass state at the start
    setCompassEnabled(false);
    setCompassMethod('');
    setCompassAccuracy(null);
    
    try {
      // Check method availability
      const methods = await checkAvailableMethods();
      setAvailableMethods(methods);
      
      // If forced to use specific method
      if (forceMethod === 'location' && methods.includes('location')) {
        return await setupLocationHeading();
      }
      
      if (forceMethod === 'magnetometer' && methods.includes('magnetometer')) {
        return await setupMagnetometer();
      }
      
      // Auto-selection: First try expo-location heading (more accurate)
      if (methods.includes('location')) {
        const locationResult = await setupLocationHeading();
        if (locationResult) return locationResult;
      }
      
      // If location heading fails, fallback to magnetometer
      if (methods.includes('magnetometer')) {
        const magnetometerResult = await setupMagnetometer();
        if (magnetometerResult) return magnetometerResult;
      }
      
      // If no methods are available or all failed
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

  // Hot-swap compass method
  const swapCompassMethod = async (method) => {
    cleanupCompass();
    setForceMethod(method);
    
    if (method === 'location') {
      // Reset the "don't show again" preference when user explicitly chooses location method
      await AsyncStorage.removeItem('qibla_location_permission_dismissed');
      return await setupLocationHeading();
    } else if (method === 'magnetometer') {
      return await setupMagnetometer();
    } else if (method === 'auto') {
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
