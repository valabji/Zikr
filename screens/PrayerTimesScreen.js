import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing, getRTLTextAlign, formatArabicTime, formatArabicCountdown, formatArabicDate } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import {
  calculatePrayerTimes,
  getCurrentAndNextPrayer,
  getTimeUntilNextPrayer,
  formatPrayerTime,
  getLocationFromIP,
  getBrowserLocation
} from '../utils/PrayerUtils';

export default function PrayerTimesScreen({ navigation }) {
  const colors = useColors();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [location, setLocation] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState(PRAYER_CONSTANTS.DEFAULT_MADHAB);

  // Load saved settings
  const loadSettings = useCallback(async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
      const savedMethod = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD);
      const savedMadhab = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB);

      if (savedLocation) {
        setLocation(JSON.parse(savedLocation));
      }
      if (savedMethod) {
        setCalculationMethod(savedMethod);
      }
      if (savedMadhab) {
        setMadhab(savedMadhab);
      }
      if (!savedLocation || !savedMethod || !savedMadhab) {
        setLoading(false);
        navigation.navigate('UnifiedPrayerSettings')
        return;
      } else {
        updatePrayerTimes(JSON.parse(savedLocation), savedMethod, savedMadhab);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Calculate and update prayer times
  const updatePrayerTimes = useCallback((locationData = location, calculationMethod2, madhab2) => {
    console.log('Updating prayer times...');
    console.log('Location Data:', locationData);
    console.log('Calculation Method:', calculationMethod2);
    console.log('Madhab:', madhab2);
    if (!locationData) return;
    if (!calculationMethod2 || !madhab2) {
      calculationMethod2 = calculationMethod || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD
      madhab2 = madhab || PRAYER_CONSTANTS.DEFAULT_MADHAB
    }
    console.log('Final Calculation Method:', calculationMethod2);
    console.log('Final Madhab:', madhab2);

    const times = calculatePrayerTimes(
      locationData.latitude,
      locationData.longitude,
      locationData.timezone,
      new Date(),
      calculationMethod2,
      madhab2
    );

    if (times) {
      setPrayerTimes(times);
      const { current, next } = getCurrentAndNextPrayer(
        times,
        locationData.latitude,
        locationData.longitude,
        locationData.timezone,
        calculationMethod2,
        madhab2
      );
      setCurrentPrayer(current);
      setNextPrayer(next);

      if (next && next.time) {
        setTimeUntilNext(getTimeUntilNextPrayer(next.time));
      }
      setLoading(false);
    }
  }, [location, calculationMethod, madhab]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      updatePrayerTimes(location);
    } catch (error) {
      Alert.alert(t('prayerTimes.error'), t('prayerTimes.refreshError'));
    } finally {
      setRefreshing(false);
    }
  }, [updatePrayerTimes]);

  // Update time until next prayer every minute
  useEffect(() => {
    const updateCountdown = () => {
      if (nextPrayer && nextPrayer.time) {
        try {
          const timeRemaining = getTimeUntilNextPrayer(nextPrayer.time);
          setTimeUntilNext(timeRemaining || '');
          
          // Check if we've reached or passed the next prayer time
          if (!timeRemaining || timeRemaining === '') {
            // Recalculate current and next prayer
            if (prayerTimes && location) {
              const { current, next } = getCurrentAndNextPrayer(
                prayerTimes,
                location.latitude,
                location.longitude,
                location.timezone,
                calculationMethod,
                madhab
              );
              setCurrentPrayer(current);
              setNextPrayer(next);
              
              // Set the new countdown
              if (next && next.time) {
                const newTimeRemaining = getTimeUntilNextPrayer(next.time);
                setTimeUntilNext(newTimeRemaining || '');
              }
            }
          }
          
          return timeRemaining;
        } catch (error) {
          console.error('Error updating countdown:', error);
          return '';
        }
      }
      return '';
    };

    // Initial update
    const timeRemaining = updateCountdown();
    
    // Determine update interval based on time remaining
    let updateInterval = PRAYER_CONSTANTS.ANIMATION.PRAYER_UPDATE_INTERVAL; // 60000ms = 1 minute
    
    // If less than 5 minutes remaining, update every 10 seconds for smoother transition
    if (timeRemaining && typeof timeRemaining === 'string' && 
        ((timeRemaining.includes('m') && parseInt(timeRemaining) <= 5) || timeRemaining.includes('s'))) {
      updateInterval = 10000; // 10 seconds
    }
    
    const interval = setInterval(() => {
      try {
        updateCountdown();

        // Recalculate prayer times at midnight
        const now = moment();
        if (now.hours() === 0 && now.minutes() === 0) {
          updatePrayerTimes();
        }
      } catch (error) {
        console.error('Error in countdown interval:', error);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [nextPrayer, updatePrayerTimes, prayerTimes, location, calculationMethod, madhab]);

  // Initialize on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update prayer times when settings change
  useEffect(() => {
    if (location) {
      updatePrayerTimes();
    }
  }, [calculationMethod, madhab, updatePrayerTimes]);

  const renderPrayerTimeCard = (prayerName, time, isNext = false, isCurrent = false) => {
    const cardColor = isCurrent
      ? colors.currentPrayer
      : isNext
        ? colors.nextPrayer
        : colors.DGreen;

    // Use dark text for bright card backgrounds
    const textColor = (isCurrent || isNext)
      ? colors.black 
      : colors.BYellow;

    return (
      <View
        key={prayerName}
        style={{
          backgroundColor: cardColor,
          borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
          padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
          marginHorizontal: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
          marginVertical: PRAYER_CONSTANTS.SPACING.TINY_PADDING,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Text style={{
          color: textColor,
          ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
        }}>
          {t(`prayerTimes.${prayerName}`)}
        </Text>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            color: textColor,
            fontSize: PRAYER_CONSTANTS.FONT_SIZES.PRAYER_TIME,
            fontFamily: "Cairo_400Regular",
          }}>
            {formatArabicTime(time)}
          </Text>

          {isNext && timeUntilNext && (
            <Text style={{
              color: textColor,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
              fontFamily: "Cairo_400Regular",
              opacity: 0.8,
              marginTop: 2
            }}>
              {t('prayerTimes.in')} {formatArabicCountdown(timeUntilNext)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
        <CHeader navigation={navigation} title={t('navigation.prayerTimes')} />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Feather name="clock" size={48} color={colors.BYellow} />
          <Text style={{
            color: colors.BYellow,
            ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
            fontFamily: "Cairo_400Regular",
            marginTop: 15,
            textAlign: 'center'
          }}>
            {t('prayerTimes.loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <CHeader navigation={navigation} title={t('navigation.prayerTimes')} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: PRAYER_CONSTANTS.SPACING.CONTAINER_PADDING }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.BYellow]}
            tintColor={colors.BYellow}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Location Info */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
              fontFamily: "Cairo_400Regular",
              textAlign: getRTLTextAlign('left'),
              marginBottom: 5
            }}>
              {location ? `${location.city}, ${location.country}` : t('prayerTimes.unknownLocation')}
            </Text>
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
              fontFamily: "Cairo_400Regular",
              textAlign: getRTLTextAlign('left'),
              opacity: 0.8
            }}>
              {formatArabicDate(moment())}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('UnifiedPrayerSettings')}
            style={{
              backgroundColor: colors.BGreen,
              borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.SMALL,
              padding: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
            }}
          >
            <Feather name="map-pin" size={20} color={colors.BYellow} />
          </TouchableOpacity>
        </View>

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <View style={{
            backgroundColor: colors.DGreen,
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
            alignItems: 'center'
          }}>
            <Text style={{
              color: colors.nextPrayer,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
              fontFamily: "Cairo_400Regular",
              marginBottom: 5
            }}>
              {t('prayerTimes.nextPrayer')}
            </Text>
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.TITLE,
              fontFamily: "Cairo_400Regular",
              marginBottom: 5
            }}>
              {t(`prayerTimes.${nextPrayer.name}`)}
            </Text>
            {timeUntilNext && (
              <Text style={{
                color: colors.BYellow,
                ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
              fontFamily: "Cairo_400Regular"
              }}>
                {t('prayerTimes.in')} {formatArabicCountdown(timeUntilNext)}
              </Text>
            )}
          </View>
        )}

        {/* Disclaimer */}
        <View style={{
          backgroundColor: colors.warningBackground,
          borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
          padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
          borderLeftWidth: 4,
          borderLeftColor: colors.noticeAccent
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
          }}>
            <Feather name="alert-circle" size={20} color={colors.noticeAccent} />
            <Text style={{
              color: colors.noticeAccent,
              ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
              fontFamily: "Cairo_400Regular",
              ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
            }}>
              {t('common.prayerTimesDisclaimer')}
            </Text>
          </View>

          <Text style={{
            color: colors.warningText,
            fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
            fontFamily: "Cairo_400Regular",
            lineHeight: 20,
            textAlign: getRTLTextAlign('left')
          }}>
            {t('common.prayerTimesDisclaimerText')}
          </Text>
        </View>
        {/* Prayer Times List */}
        {prayerTimes && (
          <View style={{
            backgroundColor: colors.DGreen,
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
            padding: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN
          }}>
            <Text style={{
              color: colors.BYellow,
              fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
              fontFamily: "Cairo_400Regular",
              textAlign: 'center',
              marginBottom: PRAYER_CONSTANTS.SPACING.BUTTON_PADDING
            }}>
              {t('prayerTimes.todaysPrayers')}
            </Text>

            {renderPrayerTimeCard('fajr', prayerTimes.fajr,
              nextPrayer?.name === 'fajr',
              currentPrayer?.name === 'fajr'
            )}
            {renderPrayerTimeCard('sunrise', prayerTimes.sunrise, false, false)}
            {renderPrayerTimeCard('dhuhr', prayerTimes.dhuhr,
              nextPrayer?.name === 'dhuhr',
              currentPrayer?.name === 'dhuhr'
            )}
            {renderPrayerTimeCard('asr', prayerTimes.asr,
              nextPrayer?.name === 'asr',
              currentPrayer?.name === 'asr'
            )}
            {renderPrayerTimeCard('maghrib', prayerTimes.maghrib,
              nextPrayer?.name === 'maghrib',
              currentPrayer?.name === 'maghrib'
            )}
            {renderPrayerTimeCard('isha', prayerTimes.isha,
              nextPrayer?.name === 'isha',
              currentPrayer?.name === 'isha'
            )}
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('UnifiedPrayerSettings')}
          style={{
            backgroundColor: colors.DGreen,
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
            padding: PRAYER_CONSTANTS.SPACING.BUTTON_PADDING,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN
          }}
        >
          <Feather name="settings" size={20} color={colors.BYellow} />
          <Text style={{
            color: colors.BYellow,
            ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
            fontFamily: "Cairo_400Regular",
            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
          }}>
            {t('prayerTimes.settings')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
