import { useState, useEffect, useRef } from 'react';
import { Platform, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { t } from '../../../core/i18n/i18n';
import { calculateQiblaDirection } from '../../../common/utils/PrayerUtils';

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
  const lastHeadingUpdate = useRef(0);
  const headingThrottle = 50; // Update every 50ms max for smoother performance

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

  // Setup expo-location true heading method
  const setupLocationTrueHeading = async () => {
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
          city: t('qibla.gpsLocationName'),
          country: t('qibla.currentPosition')
        };
        
        setGpsLocation(gpsCoords);
        setUsingGpsLocation(true);
        
      } catch (locationError) {
        setUsingGpsLocation(false);
      }

      // Start watching heading with throttling
      headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
        // Throttle updates for better performance
        const now = Date.now();
        if (now - lastHeadingUpdate.current < headingThrottle) return;
        lastHeadingUpdate.current = now;
        
        // Only use true heading for this method
        if (headingData.trueHeading !== -1) {
          const heading = headingData.trueHeading;
          setCurrentHeading(heading);
          setCompassMethod(t('qibla.methodGps'));
          setCompassAccuracy(headingData.accuracy || null);
          
          // Smooth compass rotation
          animateCompassRotation(-heading);
        }
      });

      // Set initial compass state
      setCompassEnabled(true);
      setCompassMethod(t('qibla.methodGps'));
      setCompassAccuracy(t('qibla.initializing'));
      return { gpsLocation };
    } catch (error) {
      console.error('Error setting up GPS true heading:', error);
      setCompassEnabled(false);
      setCompassMethod(t('qibla.methodUnavailable'));
      setCompassAccuracy(null);
      return false;
    }
  };

  // Setup expo-location magnetic enhanced GPS method
  const setupLocationMagneticEnhanced = async () => {
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
          city: t('qibla.gpsLocationName'),
          country: t('qibla.currentPosition')
        };
        
        setGpsLocation(gpsCoords);
        setUsingGpsLocation(true);
        
      } catch (locationError) {
        setUsingGpsLocation(false);
      }

      // Start watching heading with throttling
      headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
        // Throttle updates for better performance
        const now = Date.now();
        if (now - lastHeadingUpdate.current < headingThrottle) return;
        lastHeadingUpdate.current = now;
        
        // Only use magnetic heading for this method
        const heading = headingData.magHeading;
        setCurrentHeading(heading);
        setCompassMethod(t('qibla.methodGpsMagneticEnhanced'));
        setCompassAccuracy(headingData.accuracy || null);
        
        // Smooth compass rotation
        animateCompassRotation(-heading);
      });

      // Set initial compass state
      setCompassEnabled(true);
      setCompassMethod(t('qibla.methodGpsMagneticEnhanced'));
      setCompassAccuracy(t('qibla.initializing'));
      return { gpsLocation };
    } catch (error) {
      console.error('Error setting up GPS magnetic enhanced:', error);
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
      
      // Set update interval (optimized for smooth animation with throttling)
      Magnetometer.setUpdateInterval(150); // Faster sensor updates
      
      // Subscribe to magnetometer updates with throttling
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        // Throttle updates for better performance
        const now = Date.now();
        if (now - lastHeadingUpdate.current < headingThrottle) return;
        lastHeadingUpdate.current = now;
        
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
      duration: 100, // Faster updates for more responsive rotation during fast movement
      useNativeDriver: false,
    }).start();
  };

  // Check what compass methods are available
  const checkAvailableMethods = async () => {
    const methods = [];
    
    // Check location heading availability - include both true and magnetic enhanced GPS
    // so we can show them as separate options, but not on web
    try {
      if (Platform.OS !== 'web') {
        const hasServices = await Location.hasServicesEnabledAsync();
        if (hasServices) {
          methods.push('trueHeading');
          methods.push('magHeading');
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
      if (forceMethod === 'trueHeading' && methods.includes('trueHeading')) {
        return await setupLocationTrueHeading();
      }
      
      if (forceMethod === 'magHeading' && methods.includes('magHeading')) {
        return await setupLocationMagneticEnhanced();
      }
      
      if (forceMethod === 'magnetometer' && methods.includes('magnetometer')) {
        return await setupMagnetometer();
      }
      
      // Auto-selection: First try GPS magnetic enhanced (more reliable)
      if (methods.includes('magHeading')) {
        const magHeadingResult = await setupLocationMagneticEnhanced();
        if (magHeadingResult) return magHeadingResult;
      }
      
      // If magnetic enhanced fails, try GPS true heading
      if (methods.includes('trueHeading')) {
        const trueHeadingResult = await setupLocationTrueHeading();
        if (trueHeadingResult) return trueHeadingResult;
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
    
    if (method === 'trueHeading') {
      // Reset the "don't show again" preference when user explicitly chooses location method
      await AsyncStorage.removeItem('qibla_location_permission_dismissed');
      return await setupLocationTrueHeading();
    } else if (method === 'magHeading') {
      // Reset the "don't show again" preference when user explicitly chooses location method
      await AsyncStorage.removeItem('qibla_location_permission_dismissed');
      return await setupLocationMagneticEnhanced();
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
