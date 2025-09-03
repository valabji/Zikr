import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  ScrollView
} from 'react-native';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import {
  calculateQiblaDirection,
  getLocationFromIP,
  getBrowserLocation
} from '../utils/PrayerUtils';

export default function QiblaScreen({ navigation }) {
  const colors = useColors();
  const [location, setLocation] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isQiblaAligned, setIsQiblaAligned] = useState(false);
  const rotationValue = useRef(new Animated.Value(0)).current;
  const compassRotationValue = useRef(new Animated.Value(0)).current;
  const magnetometerSubscription = useRef(null);

  // Calculate heading from magnetometer data
  const calculateHeading = (x, y) => {
    let heading = Math.atan2(y, x) * (180 / Math.PI);
    // Convert to 0-360 range
    heading = (heading + 360) % 360;
    return heading;
  };

  // Setup magnetometer
  const setupMagnetometer = async () => {
    try {
      const { status } = await Magnetometer.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Magnetometer permission denied');
        setCompassEnabled(false);
        return;
      }

      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('Magnetometer not available');
        setCompassEnabled(false);
        return;
      }

      setCompassEnabled(true);
      
      // Set update interval (4 times per second for smooth animation)
      Magnetometer.setUpdateInterval(250);
      
      // Subscribe to magnetometer updates
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        setMagnetometerData(data);
        const heading = calculateHeading(data.x, data.y);
        setCurrentHeading(heading);
        
        // Smooth compass rotation
        animateCompassRotation(-heading); // Negative to rotate compass in correct direction
      });
      
    } catch (error) {
      console.error('Error setting up magnetometer:', error);
      setCompassEnabled(false);
    }
  };

  // Cleanup magnetometer
  const cleanupMagnetometer = () => {
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

  // Load location
  const loadLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setLocation(locationData);
        const direction = calculateQiblaDirection(locationData.latitude, locationData.longitude);
        setQiblaDirection(direction);
      }else{
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
      await setupMagnetometer();
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
      cleanupMagnetometer();
    };
  }, []);

  // Cleanup when screen loses focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      cleanupMagnetometer();
    });
    
    const refocus = navigation.addListener('focus', () => {
      if (compassEnabled) {
        setupMagnetometer();
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
        {/* Compass */}
        <View style={{
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: colors.DGreen,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
          marginTop: 10,
          position: 'relative',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* Outer Ring */}
          <View style={{
            width: 260,
            height: 260,
            borderRadius: 130,
            borderWidth: 3,
            borderColor: colors.BYellow,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            {/* Degree Markings and Labels - Rotate with compass */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: compassEnabled ? [
                  {
                    rotate: compassRotationValue.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ] : [],
              }}
            >
              {/* Degree Markings */}
              {Array.from({ length: 36 }, (_, i) => i * 10).map((degree) => (
                <View
                  key={degree}
                  style={{
                    position: 'absolute',
                    width: degree % 90 === 0 ? 3 : degree % 30 === 0 ? 2 : 1,
                    height: degree % 90 === 0 ? 0 : degree % 30 === 0 ? 12 : 8,
                    backgroundColor: colors.BYellow,
                    borderRadius: 1,
                    transform: [
                      { rotate: `${degree}deg` },
                      { translateY: -115 }
                    ],
                    left: '50%',
                    top: '50%',
                    marginLeft: degree % 90 === 0 ? -1.5 : degree % 30 === 0 ? -1 : -0.5,
                    marginTop: degree % 90 === 0 ? -10 : degree % 30 === 0 ? -6 : -4
                  }}
                />
              ))}

              {/* Cardinal Direction Labels */}
              {[
                { label: 'N', angle: 0, size: 18, weight: 'Cairo_700Bold' },
                { label: 'E', angle: 90, size: 18, weight: 'Cairo_700Bold' },
                { label: 'S', angle: 180, size: 18, weight: 'Cairo_700Bold' },
                { label: 'W', angle: 270, size: 18, weight: 'Cairo_700Bold' }
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    position: 'absolute',
                    width: 30,
                    height: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [
                      { rotate: `${item.angle}deg` },
                      { translateY: -115 }
                    ],
                    left: '50%',
                    top: '50%',
                    marginLeft: -15,
                    marginTop: -15
                  }}
                >
                  <Animated.Text style={{
                    color: colors.BYellow,
                    fontSize: item.size,
                    fontFamily: item.weight,
                    fontWeight: item.label === 'N' ? 'bold' : 'normal',
                    transform: compassEnabled ? [
                      {
                        rotate: compassRotationValue.interpolate({
                          inputRange: [0, 360],
                          outputRange: ['0deg', '-360deg'],
                        }),
                      },
                      { rotate: `${-item.angle}deg` }
                    ] : [{ rotate: `${-item.angle}deg` }]
                  }}>
                    {item.label}
                  </Animated.Text>
                </View>
              ))}
            </Animated.View>

            {/* Inner Compass Circle */}
            <View style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              backgroundColor: 'rgba(0,0,0,0.05)'
            }}>
              {/* Compass Rose (rotates with compass if enabled) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: compassEnabled ? [
                    {
                      rotate: compassRotationValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ] : [],
                }}
              >
                {/* North Indicator Arrow */}
                <View style={{
                  position: 'absolute',
                  top: 15,
                  left: '50%',
                  marginLeft: -8,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderBottomWidth: 25,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: colors.BYellow,
                }} />
              </Animated.View>
              
              {/* Qibla Direction Indicator (always points to Qibla) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: compassEnabled ? [
                    {
                      rotate: rotationValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ] : [
                    {
                      rotate: rotationValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                {/* Qibla Arrow */}
                <View style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderBottomWidth: 65,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: isQiblaAligned ? '#22c55e' : '#FF6B35',
                  position: 'absolute',
                  top: -75,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5
                }} />
                
                {/* Qibla Arrow Tail */}
                <View style={{
                  width: 5,
                  height: 50,
                  backgroundColor: isQiblaAligned ? '#22c55e' : '#FF6B35',
                  borderRadius: 3,
                  position: 'absolute',
                  top: -10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5
                }} />
              </Animated.View>              {/* Center Hub */}
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.BYellow,
                position: 'absolute',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
                borderWidth: 2,
                borderColor: '#fff'
              }} />
              
              {/* Qibla Label */}
              <Animated.View
                style={{
                  position: 'absolute',
                  transform: [
                    {
                      rotate: rotationValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <View style={{
                  position: 'absolute',
                  top: -95,
                  left: -12,
                  // backgroundColor: 'rgba(0,0,0,0.8)',
                  paddingHorizontal: 6,
                  paddingVertical: 4,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                  minHeight: 24
                }}>
                  {/* <Feather name="navigation" size={14} color="#FF6B35" /> */}
                </View>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
          alignItems: 'center',
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10
          }}>
            <Feather name="map-pin" size={20} color={colors.BYellow} />
            <Text style={[
              PRAYER_CONSTANTS.FONT_STYLES.SUBTITLE,
              {
                color: colors.BYellow,
                textAlign: 'center',
                fontWeight: '600',
                ...getDirectionalMixedSpacing({ marginLeft: 6 })
              }
            ]}>
              {location ? `${location.city}, ${location.country}` : t('qibla.unknownLocation')}
            </Text>
          </View>

          {/* Compass Status */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: compassEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: compassEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          }}>
            <Feather 
              name={compassEnabled ? "compass" : "compass"} 
              size={16} 
              color={compassEnabled ? "#22c55e" : "#ef4444"} 
            />
            <Text style={[
              PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
              {
                color: compassEnabled ? "#22c55e" : "#ef4444",
                fontWeight: '500',
                ...getDirectionalMixedSpacing({ marginLeft: 6 })
              }
            ]}>
              {compassEnabled ? t('qibla.compassEnabled') : t('qibla.compassDisabled')}
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingHorizontal: 20
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[
                PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                {
                  color: colors.BYellow,
                  opacity: 0.7
                }
              ]}>
                {t('qibla.direction')}
              </Text>
              <Text style={[
                PRAYER_CONSTANTS.FONT_STYLES.QIBLA_DEGREE,
                {
                  color: isQiblaAligned ? '#22c55e' : '#FF6B35',
                  fontWeight: '700',
                  textAlign: 'center'
                }
              ]}>
                {Math.round(qiblaDirection * 10) / 10}°
              </Text>
            </View>

            {compassEnabled && (
              <View style={{ alignItems: 'center' }}>
                <Text style={[
                  PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                  {
                    color: colors.BYellow,
                    opacity: 0.7
                  }
                ]}>
                  {t('qibla.currentHeading')}
                </Text>
                <Text style={[
                  PRAYER_CONSTANTS.FONT_STYLES.BODY,
                  {
                    color: colors.BYellow,
                    fontWeight: '600',
                    textAlign: 'center'
                  }
                ]}>
                  {Math.round(currentHeading * 10) / 10}°
                </Text>
              </View>
            )}
            
            <View style={{ alignItems: 'center' }}>
              <Text style={[
                PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                {
                  color: colors.BYellow,
                  opacity: 0.7
                }
              ]}>
                {t('qibla.bearing')}
              </Text>
              <Text style={[
                PRAYER_CONSTANTS.FONT_STYLES.BODY,
                {
                  color: colors.BYellow,
                  fontWeight: '600',
                  textAlign: 'center'
                }
              ]}>
                {qiblaDirection >= 0 && qiblaDirection < 22.5 ? 'N' :
                 qiblaDirection >= 22.5 && qiblaDirection < 67.5 ? 'NE' :
                 qiblaDirection >= 67.5 && qiblaDirection < 112.5 ? 'E' :
                 qiblaDirection >= 112.5 && qiblaDirection < 157.5 ? 'SE' :
                 qiblaDirection >= 157.5 && qiblaDirection < 202.5 ? 'S' :
                 qiblaDirection >= 202.5 && qiblaDirection < 247.5 ? 'SW' :
                 qiblaDirection >= 247.5 && qiblaDirection < 292.5 ? 'W' :
                 qiblaDirection >= 292.5 && qiblaDirection < 337.5 ? 'NW' : 'N'}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
          padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
          }}>
            <Feather name="info" size={20} color={colors.BYellow} />
            <Text style={[
              PRAYER_CONSTANTS.FONT_STYLES.BODY,
              {
                color: colors.BYellow,
                fontWeight: '600',
                ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
              }
            ]}>
              {t('qibla.instructions')}
            </Text>
          </View>
          
          <Text style={{
            color: colors.BYellow,
            fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
            fontFamily: "Cairo_400Regular",
            lineHeight: 22,
            opacity: 0.9,
            textAlign: getRTLTextAlign('left')
          }}>
            {compassEnabled 
              ? t('qibla.instructionsWithCompass')
              : t('qibla.instructionsWithoutCompass')
            }
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
            paddingTop: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.2)'
          }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: isQiblaAligned ? '#22c55e' : '#FF6B35',
              borderRadius: 2,
              ...getDirectionalMixedSpacing({marginRight:8})
            }} />
            <Text style={{
              color: isQiblaAligned ? '#22c55e' : '#FF6B35',
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
              fontFamily: "Cairo_400Regular",
              opacity: 0.9
            }}>
              {isQiblaAligned ? t('qibla.aligned') : t('qibla.arrowIndicator')}
            </Text>
          </View>
        </View>

        {/* Additional Notice for No Compass */}
        {!compassEnabled && (
          <View style={{
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
            borderLeftWidth: 4,
            borderLeftColor: '#FFC107',
            borderWidth: 1,
            borderColor: 'rgba(255, 193, 7, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            width: '100%'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
            }}>
              <Feather name="compass" size={18} color="#FFC107" />
              <Text style={{
                color: '#FFC107',
                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                fontFamily: "Cairo_400Regular",
                ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
              }}>
                {t('qibla.compassDisabled')}
              </Text>
            </View>
            
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
              fontFamily: "Cairo_400Regular",
              lineHeight: 18,
              textAlign: getRTLTextAlign('left'),
              opacity: 0.9
            }}>
              {t('qibla.compassNotAvailableNotice')}
            </Text>
          </View>
        )}

        {/* Compass Accuracy Warning */}
        {compassEnabled && (
          <View style={{
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
            padding: PRAYER_CONSTANTS.SPACING.BUTTON_PADDING,
            marginTop: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
            borderLeftWidth: 4,
            borderLeftColor: '#FF6B35',
            borderWidth: 1,
            borderColor: 'rgba(255, 107, 53, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
            }}>
              <Feather name="alert-triangle" size={18} color="#FF6B35" />
              <Text style={{
                color: '#FF6B35',
                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                fontFamily: "Cairo_400Regular",
                ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
              }}>
                {t('qibla.compassAccuracy')}
              </Text>
            </View>
            
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
              fontFamily: "Cairo_400Regular",
              lineHeight: 18,
              textAlign: getRTLTextAlign('left'),
              opacity: 0.9
            }}>
              {t('qibla.compassAccuracyText', { degrees: Math.round(qiblaDirection) })}
            </Text>
          </View>
        )}

        {/* Change Location Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('UnifiedPrayerSettings')}
          style={{
            backgroundColor: colors.DGreen,
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
            padding: PRAYER_CONSTANTS.SPACING.BUTTON_PADDING,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
            borderWidth: 2,
            borderColor: colors.BYellow,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5
          }}
        >
          <Feather name="map-pin" size={20} color={colors.BYellow} />
          <Text style={{
            color: colors.BYellow,
            ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
            fontFamily: "Cairo_400Regular",
            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
          }}>
            {t('qibla.changeLocation')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
