import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated
} from 'react-native';
import { useColors } from '../../../core/theme/Colors';
import { t } from '../../../core/i18n/i18n';
import CHeader from '../../../common/components/CHeader';
import QiblaCompass from '../components/QiblaCompass';
import LocationInfo from '../../../common/components/LocationInfo';
import QiblaInstructions from '../components/QiblaInstructions';
import { useQiblaCompass } from '../hooks/useQiblaCompass';
import { useAudio } from '../../../common/utils/Sounds';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { calculateQiblaDirection } from '../../../common/utils/PrayerUtils';

export default function QiblaScreen({ navigation }) {
  const colors = useColors();
  const { playClick } = useAudio();
  const [location, setLocation] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isQiblaAligned, setIsQiblaAligned] = useState(false);
  const [isQiblaClose, setIsQiblaClose] = useState(false);
  const [currentAngleDifference, setCurrentAngleDifference] = useState(0);
  const rotationValue = useRef(new Animated.Value(0)).current;
  const previousAlignment = useRef(false);
  const alignmentUpdateThrottle = useRef(0);

  // Use the compass hook
  const {
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
    swapCompassMethod
  } = useQiblaCompass();

  // Load location
  const loadLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setLocation(locationData);
        const direction = calculateQiblaDirection(locationData.latitude, locationData.longitude);
        setQiblaDirection(direction);
      } else {
        navigation.navigate('UnifiedPrayerSettings');
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  // Initialize data
  const initializeData = async () => {
    setLoading(true);
    try {
      await loadLocation();

      const compassResult = await initializeCompass();

      // If GPS location was obtained from compass hook, update qibla direction
      if (compassResult && compassResult.gpsLocation) {
        const direction = calculateQiblaDirection(
          compassResult.gpsLocation.latitude,
          compassResult.gpsLocation.longitude
        );
        setQiblaDirection(direction);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();

    // Cleanup on unmount
    return () => {
      cleanupCompass();
    };
  }, []);

  // Cleanup when screen loses focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      cleanupCompass();
    });

    const refocus = navigation.addListener('focus', () => {
      if (compassEnabled) {
        initializeCompass();
      }
    });

    return () => {
      unsubscribe();
      refocus();
    };
  }, [navigation, compassEnabled]);

  // Throttled alignment calculation to improve performance during fast rotation
  const calculateAlignmentStates = useCallback((angleDifference) => {
    const alignmentThreshold = 1.0;
    const closeThreshold = 10.0;
    const normalizedDifference = Math.min(angleDifference, 360 - angleDifference);

    const isAligned = normalizedDifference <= alignmentThreshold;
    const isClose = normalizedDifference <= closeThreshold;

    return { isAligned, isClose: isClose && !isAligned, normalizedDifference };
  }, []);

  // Animate compass rotation
  useEffect(() => {
    if (qiblaDirection !== null && qiblaDirection !== undefined) {
      let targetAngle = qiblaDirection;

      // If compass is enabled, adjust for current heading
      if (compassEnabled) {
        targetAngle = qiblaDirection - currentHeading;
      }

      const currentValue = rotationValue._value;

      // Handle 0-360 degree wrap around
      if (Math.abs(targetAngle - currentValue) > 180) {
        if (targetAngle > currentValue) {
          targetAngle -= 360;
        } else {
          targetAngle += 360;
        }
      }

      // Calculate alignment states
      const angleDifference = Math.abs(targetAngle);
      const { isAligned, isClose, normalizedDifference } = calculateAlignmentStates(angleDifference);

      // Update angle difference immediately for color calculations
      setCurrentAngleDifference(normalizedDifference);

      // Throttle alignment state updates to reduce re-renders during fast rotation
      const now = Date.now();
      if (now - alignmentUpdateThrottle.current > 100) { // Update every 100ms max
        setIsQiblaAligned(isAligned);
        setIsQiblaClose(isClose);
        alignmentUpdateThrottle.current = now;
      }

      Animated.timing(rotationValue, {
        toValue: targetAngle,
        duration: compassEnabled ? 150 : PRAYER_CONSTANTS.ANIMATION.COMPASS_ROTATION_DURATION, // Slightly faster for smoother updates
        useNativeDriver: false,
      }).start();
    }
  }, [qiblaDirection, compassEnabled, currentHeading, calculateAlignmentStates]);

  // Play sound when Qibla becomes aligned
  useEffect(() => {
    if (isQiblaAligned && !previousAlignment.current && compassEnabled) {
      // Only play sound if transitioning from not aligned to aligned
      // and only when compass is enabled (to avoid false positives)
      playClick();
    }
    previousAlignment.current = isQiblaAligned;
  }, [isQiblaAligned, compassEnabled, playClick]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
        <CHeader navigation={navigation} isHome={true} title={t('navigation.qibla')} />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Feather name="compass" size={48} color={colors.BYellow} />
          <Text style={[
            PRAYER_CONSTANTS.FONT_STYLES.BODY,
            {
              color: colors.BYellow,
              marginTop: 15,
              textAlign: 'center'
            }
          ]}>
            {t('qibla.loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <CHeader navigation={navigation} isHome={true} title={t('navigation.qibla')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: PRAYER_CONSTANTS.SPACING.CONTAINER_PADDING,
          paddingTop: 10,
          alignItems: 'center',
          minHeight: '100%'
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Qibla Compass */}
        <QiblaCompass
          qiblaDirection={qiblaDirection}
          isQiblaAligned={isQiblaAligned}
          isQiblaClose={isQiblaClose}
          compassEnabled={compassEnabled}
          compassRotationValue={compassRotationValue}
          rotationValue={rotationValue}
          currentAngleDifference={currentAngleDifference}
        />

        {/* Location Info */}
        <LocationInfo
          location={location}
          gpsLocation={gpsLocation}
          usingGpsLocation={usingGpsLocation}
          qiblaDirection={qiblaDirection}
          currentHeading={currentHeading}
          isQiblaAligned={isQiblaAligned}
          isQiblaClose={isQiblaClose}
          compassEnabled={compassEnabled}
          compassMethod={compassMethod}
          compassAccuracy={compassAccuracy}
          availableMethods={availableMethods}
          onSwapCompassMethod={swapCompassMethod}
        />

        {/* Instructions and Controls */}
        <QiblaInstructions
          compassEnabled={compassEnabled}
          isQiblaAligned={isQiblaAligned}
          isQiblaClose={isQiblaClose}
          qiblaDirection={qiblaDirection}
          onRetryCompass={initializeCompass}
          onNavigateToSettings={() => navigation.navigate('UnifiedPrayerSettings')}
        />
      </ScrollView>
    </View>
  );
}
