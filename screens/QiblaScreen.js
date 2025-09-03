import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated
} from 'react-native';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import CHeader from '../components/CHeader';
import QiblaCompass from '../components/QiblaCompass';
import LocationInfo from '../components/LocationInfo';
import QiblaInstructions from '../components/QiblaInstructions';
import { useQiblaCompass } from '../hooks/useQiblaCompass';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { calculateQiblaDirection } from '../utils/PrayerUtils';

export default function QiblaScreen({ navigation }) {
  const colors = useColors();
  const [location, setLocation] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isQiblaAligned, setIsQiblaAligned] = useState(false);
  const rotationValue = useRef(new Animated.Value(0)).current;

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
      
      // Check if Qibla is aligned (within ±1 degree)
      const alignmentThreshold = 0.5;
      const angleDifference = Math.abs(targetAngle);
      const normalizedDifference = Math.min(angleDifference, 360 - angleDifference);
      setIsQiblaAligned(normalizedDifference <= alignmentThreshold);
      
      Animated.timing(rotationValue, {
        toValue: targetAngle,
        duration: compassEnabled ? 200 : PRAYER_CONSTANTS.ANIMATION.COMPASS_ROTATION_DURATION,
        useNativeDriver: false,
      }).start();
    }
  }, [qiblaDirection, compassEnabled, currentHeading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
        <CHeader navigation={navigation} title={t('navigation.qibla')} />
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
      <CHeader navigation={navigation} title={t('navigation.qibla')} />
      
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
          compassEnabled={compassEnabled}
          compassRotationValue={compassRotationValue}
          rotationValue={rotationValue}
        />

        {/* Location Info */}
        <LocationInfo
          location={location}
          gpsLocation={gpsLocation}
          usingGpsLocation={usingGpsLocation}
          qiblaDirection={qiblaDirection}
          currentHeading={currentHeading}
          isQiblaAligned={isQiblaAligned}
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
          qiblaDirection={qiblaDirection}
          onRetryCompass={initializeCompass}
          onNavigateToSettings={() => navigation.navigate('UnifiedPrayerSettings')}
        />
      </ScrollView>
    </View>
  );
}
