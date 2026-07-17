import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import moment from 'moment-timezone';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { togglePrayerCheckInForDate, MANDATORY_PRAYERS } from '@/utils/prayer/PrayerCheckIn';

export default function PrayerStreakCard({ checkInStats, checkInHistory, isPrayerAvailable, colors }) {
  const [historyExpanded, setHistoryExpanded] = useState(false);

  return (
    <View
      testID="prayer-streak-banner"
      style={{
        backgroundColor: colors.DGreen,
        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
        marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="zap" size={22} color={colors.nextPrayer} />
          <View style={{ ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }) }}>
            <Text style={{
              color: colors.BYellow,
              ...PRAYER_CONSTANTS.FONT_STYLES.BODY,
              fontFamily: "Cairo_400Regular",
            }}>
              {checkInStats.streak > 0
                ? t('prayerTimes.streakDays', { count: checkInStats.streak })
                : t('prayerTimes.streakDaysZero')}
            </Text>
          </View>
        </View>
        <Text style={{
          color: colors.BYellow,
          fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
          fontFamily: "Cairo_400Regular",
          opacity: 0.8
        }}>
          {t('prayerTimes.prayersCompletedToday', { count: checkInStats.todayCount, total: checkInStats.todayTotal })}
        </Text>
      </View>

      <TouchableOpacity
        testID="prayer-history-trigger"
        onPress={() => setHistoryExpanded(v => !v)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: PRAYER_CONSTANTS.SPACING.TINY_PADDING }}
      >
        <Text style={{
          color: colors.BYellow,
          fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
          fontFamily: "Cairo_400Regular",
          opacity: 0.55,
          textAlign: getRTLTextAlign('left'),
        }}>
          {t('prayerTimes.history')}
        </Text>
        <Feather
          name={historyExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.BYellow}
          style={{ opacity: 0.55, ...getDirectionalMixedSpacing({ marginLeft: 4 }) }}
        />
      </TouchableOpacity>

      {historyExpanded && (
        <View style={{ marginTop: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }}>
          <View style={{ height: 1, backgroundColor: colors.BYellow, opacity: 0.15, marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }} />
          {checkInHistory.map((row) => {
            const label = row.offsetDays === 0
              ? t('prayerTimes.today')
              : row.offsetDays === 1
                ? t('prayerTimes.yesterday')
                : moment(row.dateKey).format('ddd, MMM D');
            return (
              <View
                key={row.dateKey}
                testID={`history-row-${row.dateKey}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                }}
              >
                <Text style={{
                  color: colors.BYellow,
                  fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                  fontFamily: "Cairo_400Regular",
                }}>
                  {label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {MANDATORY_PRAYERS.map((p) => {
                    const rowAvailable = row.offsetDays > 0 || isPrayerAvailable(p);
                    return rowAvailable ? (
                      <TouchableOpacity
                        key={p}
                        onPress={() => togglePrayerCheckInForDate(p, row.dateKey)}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        style={getDirectionalMixedSpacing({ marginLeft: 4 })}
                      >
                        <Feather
                          name={row.day[p] ? 'check-circle' : 'circle'}
                          size={14}
                          color={row.complete ? colors.currentPrayer : colors.BYellow}
                          style={{ opacity: row.day[p] ? 1 : 0.35 }}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View key={p} style={getDirectionalMixedSpacing({ marginLeft: 4 })}>
                        <Feather name="circle" size={14} color={colors.BYellow} style={{ opacity: 0.2 }} />
                      </View>
                    );
                  })}
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
                    fontFamily: "Cairo_400Regular",
                    opacity: 0.8,
                    ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.TINY_PADDING }),
                  }}>
                    {`${row.count}/${row.total}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
