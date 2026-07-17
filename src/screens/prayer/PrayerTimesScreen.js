import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useColors } from '@/constants/Colors';
import { t, getDirectionalMixedSpacing, getRTLTextAlign, formatArabicCountdown, formatArabicDate } from '@/locales/i18n';
import CustomHeader from '@/components/CustomHeader';
import { Feather } from '@expo/vector-icons';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { usePrayerCheckIn, getCheckInHistory } from '@/utils/prayer/PrayerCheckIn';
import PrayerTimeCard, { PRAYER_CARD_ORDER } from '@/components/prayer/PrayerTimeCard';
import PrayerStreakCard from '@/components/prayer/PrayerStreakCard';
import { usePrayerSettings } from '@/hooks/prayer/usePrayerSettings';
import { usePrayerCountdown } from '@/hooks/prayer/usePrayerCountdown';

export default function PrayerTimesScreen({ navigation }) {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { location, calculationMethod, madhab, loadPrayerSettings } = usePrayerSettings();
  const { prayerTimes, currentPrayer, nextPrayer, timeUntilNext, updatePrayerTimes, isPrayerAvailable } =
    usePrayerCountdown({ location, calculationMethod, madhab });
  const { state: checkInState, stats: checkInStats } = usePrayerCheckIn();
  const checkInHistory = useMemo(() => getCheckInHistory(checkInState, 7), [checkInState]);

  const loadSettings = useCallback(async () => {
    try {
      const saved = await loadPrayerSettings();
      if (!saved.complete) {
        setLoading(false);
        navigation.navigate('UnifiedPrayerSettings');
        return;
      }
      if (updatePrayerTimes(saved.location, saved.calculationMethod, saved.madhab)) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      updatePrayerTimes();
    } catch (error) {
      Alert.alert(t('prayerTimes.error'), t('prayerTimes.refreshError'));
    } finally {
      setRefreshing(false);
    }
  }, [updatePrayerTimes]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="prayer-times-loading">
        <CustomHeader navigation={navigation} isHome={true} title={t('navigation.prayerTimes')} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="prayer-times-content">
      <CustomHeader navigation={navigation} isHome={true} title={t('navigation.prayerTimes')} />

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

        <PrayerStreakCard
          checkInStats={checkInStats}
          checkInHistory={checkInHistory}
          isPrayerAvailable={isPrayerAvailable}
          colors={colors}
        />

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

            {PRAYER_CARD_ORDER.map((name) => (
              <PrayerTimeCard
                key={name}
                prayerName={name}
                time={prayerTimes[name]}
                isNext={name !== 'sunrise' && nextPrayer?.name === name}
                isCurrent={name !== 'sunrise' && currentPrayer?.name === name}
                timeUntilNext={timeUntilNext}
                isPrayed={!!checkInStats.today[name]}
                available={isPrayerAvailable(name)}
                colors={colors}
              />
            ))}
          </View>
        )}

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
