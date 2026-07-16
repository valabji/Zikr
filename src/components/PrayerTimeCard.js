import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getItemColors } from '@/constants/Colors';
import { t, getDirectionalMixedSpacing, formatArabicTime, formatArabicCountdown } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { togglePrayerCheckIn, MANDATORY_PRAYERS } from '@/utils/PrayerCheckIn';

export const PRAYER_CARD_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerTimeCard({ prayerName, time, isNext, isCurrent, timeUntilNext, isPrayed, available, colors }) {
  const g = (!isCurrent && !isNext)
    ? getItemColors(colors, PRAYER_CARD_ORDER.indexOf(prayerName))
    : null;

  const cardColor = isCurrent
    ? colors.currentPrayer
    : isNext
      ? colors.nextPrayer
      : g ? 'transparent' : colors.DGreen;

  const textColor = (isCurrent || isNext)
    ? colors.black
    : g ? g.fg : colors.BYellow;

  const isMandatory = MANDATORY_PRAYERS.includes(prayerName);

  return (
    <View
      style={{
        backgroundColor: cardColor,
        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
        marginHorizontal: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
        marginVertical: PRAYER_CONSTANTS.SPACING.TINY_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}
    >
      {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
      <Text style={{
        color: textColor,
        ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
      }}>
        {t(`prayerTimes.${prayerName}`)}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

        {isMandatory && (
          available ? (
            <TouchableOpacity
              testID={`checkin-${prayerName}`}
              accessibilityLabel={t('prayerTimes.markAsPrayed')}
              onPress={() => togglePrayerCheckIn(prayerName)}
              style={{ ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }), padding: 4 }}
            >
              <Feather
                name={isPrayed ? 'check-circle' : 'circle'}
                size={24}
                color={textColor}
                style={{ opacity: isPrayed ? 1 : 0.5 }}
              />
            </TouchableOpacity>
          ) : (
            <View
              testID={`checkin-${prayerName}`}
              style={{ ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }), padding: 4 }}
            >
              <Feather name="circle" size={24} color={textColor} style={{ opacity: 0.2 }} />
            </View>
          )
        )}
      </View>
    </View>
  );
}
