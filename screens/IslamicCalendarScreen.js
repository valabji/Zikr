import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import CHeader from '../components/CHeader';
import { useColors, getItemColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing } from '../locales/i18n';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { ISLAMIC_CALENDAR_CONSTANTS } from '../constants/IslamicCalendarConstants';
import {
  toHijri,
  formatHijriDate,
  getHijriMonthGrid,
  addHijriMonths,
  getUpcomingEvents,
  dateKey,
} from '../utils/HijriCalendar';
import { useFastingTracker, toggleFastDay } from '../utils/FastingTracker';
import { scheduleFastDayNotifications, cancelFastDayNotifications } from '../utils/IftarSuhoorNotifications';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function countdownLabel(daysRemaining) {
  if (daysRemaining === 0) return t('islamicCalendar.today');
  if (daysRemaining === 1) return t('islamicCalendar.inOneDay');
  return t('islamicCalendar.inDays', { count: daysRemaining });
}

export default function IslamicCalendarScreen({ navigation }) {
  const colors = useColors();
  const todayHijri = useMemo(() => toHijri(new Date()), []);
  const [iYear, setIYear] = useState(todayHijri.iYear);
  const [iMonth, setIMonth] = useState(todayHijri.iMonth);
  const [selectedKey, setSelectedKey] = useState(dateKey(new Date()));
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  const { state: fastingState, stats } = useFastingTracker();

  useEffect(() => {
    AsyncStorage.getItem(ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED).then((v) => {
      setRemindersEnabled(v === 'true');
    });
    AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION).then((v) => {
      setHasLocation(!!v);
    });
  }, []);

  const grid = useMemo(() => getHijriMonthGrid(iYear, iMonth), [iYear, iMonth]);
  const upcomingEvents = useMemo(() => getUpcomingEvents(new Date()), []);
  const selectedDayEvent = useMemo(
    () => ISLAMIC_CALENDAR_CONSTANTS.SIGNIFICANT_EVENTS.find((event) => {
      const cell = grid.weeks.flat().find((c) => c && c.key === selectedKey);
      return cell && event.iMonth === iMonth && event.iDay === cell.iDay;
    }),
    [grid, iMonth, selectedKey]
  );

  const goToMonth = useCallback((delta) => {
    const next = addHijriMonths(iYear, iMonth, delta);
    setIYear(next.iYear);
    setIMonth(next.iMonth);
  }, [iYear, iMonth]);

  const selectDay = useCallback((cell) => {
    if (!cell) return;
    setSelectedKey(cell.key);
  }, []);

  const onToggleFasting = useCallback(async () => {
    const isNowFasting = toggleFastDay(selectedKey);
    if (remindersEnabled) {
      const selectedDate = new Date(`${selectedKey}T00:00:00`);
      if (isNowFasting) {
        await scheduleFastDayNotifications(selectedDate);
      } else {
        await cancelFastDayNotifications(selectedDate);
      }
    }
  }, [selectedKey, remindersEnabled]);

  const onToggleReminders = useCallback(async () => {
    if (!remindersEnabled && !hasLocation) {
      Alert.alert(t('islamicCalendar.title'), t('islamicCalendar.remindersNeedLocation'));
      return;
    }
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    await AsyncStorage.setItem(ISLAMIC_CALENDAR_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(next));

    const fastDayKeys = Object.keys((fastingState && fastingState.days) || {}).filter(
      (key) => key >= dateKey(new Date())
    );
    for (const key of fastDayKeys) {
      const date = new Date(`${key}T00:00:00`);
      if (next) {
        await scheduleFastDayNotifications(date);
      } else {
        await cancelFastDayNotifications(date);
      }
    }
  }, [remindersEnabled, hasLocation, fastingState]);

  const isSelectedFasting = !!(fastingState && fastingState.days && fastingState.days[selectedKey]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="islamic-calendar-screen">
      <CHeader navigation={navigation} isHome={true} title={t('islamicCalendar.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
          {t('islamicCalendar.todayIs', { date: formatHijriDate(new Date()) })}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity
            testID="calendar-prev-month"
            onPress={() => goToMonth(isRTL() ? 1 : -1)}
            style={{ padding: 10 }}
          >
            <Feather name={isRTL() ? 'chevron-right' : 'chevron-left'} size={22} color={colors.accent} />
          </TouchableOpacity>
          <Text style={{ ...textStyles.subtitle, color: colors.text }}>
            {grid.monthName} {iYear}
          </Text>
          <TouchableOpacity
            testID="calendar-next-month"
            onPress={() => goToMonth(isRTL() ? -1 : 1)}
            style={{ padding: 10 }}
          >
            <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {WEEKDAY_LABELS.map((label, idx) => (
            <View key={`wd-${idx}`} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ ...textStyles.caption, color: colors.textSecondary }}>{label}</Text>
            </View>
          ))}
        </View>

        {grid.weeks.map((week, weekIdx) => (
          <View key={`week-${weekIdx}`} style={{ flexDirection: 'row' }}>
            {week.map((cell, cellIdx) => {
              if (!cell) {
                return <View key={`empty-${weekIdx}-${cellIdx}`} style={{ flex: 1, height: 52 }} />;
              }
              const isSelected = cell.key === selectedKey;
              const isFasting = !!(fastingState && fastingState.days && fastingState.days[cell.key]);
              const hasEvent = ISLAMIC_CALENDAR_CONSTANTS.SIGNIFICANT_EVENTS.some(
                (event) => event.iMonth === iMonth && event.iDay === cell.iDay
              );
              return (
                <TouchableOpacity
                  key={`day-${cell.key}`}
                  testID={`calendar-day-${cell.key}`}
                  onPress={() => selectDay(cell)}
                  style={{
                    flex: 1,
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 1,
                    borderRadius: 8,
                    backgroundColor: isSelected ? colors.accent : cell.isToday ? colors.surface : 'transparent',
                    borderWidth: cell.isToday && !isSelected ? 1 : 0,
                    borderColor: colors.accent,
                  }}
                >
                  <Text style={{
                    ...textStyles.body,
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: cell.isToday ? '700' : '400',
                  }}>
                    {cell.iDay}
                  </Text>
                  <Text style={{ ...textStyles.caption, color: isSelected ? colors.primary : colors.textSecondary, fontSize: 10 }}>
                    {cell.gregorianDay}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2, height: 6 }}>
                    {hasEvent && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isSelected ? colors.primary : colors.accent, marginHorizontal: 1 }} />}
                    {isFasting && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isSelected ? colors.primary : colors.currentPrayer, marginHorizontal: 1 }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 20 }}>
          <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary }}>{t('islamicCalendar.selectedDate')}</Text>
          <Text style={{ ...textStyles.body, color: colors.text, marginTop: 4 }}>
            {selectedDayEvent ? t(`islamicCalendar.events.${selectedDayEvent.key}`) : t('islamicCalendar.noEventToday')}
          </Text>

          <TouchableOpacity
            testID="toggle-fasting-button"
            onPress={onToggleFasting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 14,
              backgroundColor: isSelectedFasting ? colors.currentPrayer : colors.primaryMedium,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <Feather name={isSelectedFasting ? 'check-circle' : 'circle'} size={18} color={colors.text} />
            <Text style={{
              ...textStyles.body,
              color: colors.text,
              ...getDirectionalMixedSpacing({ marginLeft: 10, marginRight: 10 }),
            }}>
              {isSelectedFasting ? t('islamicCalendar.unmarkFasting') : t('islamicCalendar.markFasting')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 10 }}>
            {t('islamicCalendar.upcomingEvents')}
          </Text>
          {upcomingEvents.map((event, i) => {
            const g = getItemColors(colors, i);
            return (
              <View
                key={event.key}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: g ? 'transparent' : colors.surface,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
                <Text style={{ ...textStyles.body, color: g ? g.fg : colors.text }}>{t(`islamicCalendar.events.${event.key}`)}</Text>
                <Text style={{ ...textStyles.bodySmall, color: g ? g.fg : colors.accent }}>{countdownLabel(event.daysRemaining)}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          <Text style={{ ...textStyles.subtitle, color: colors.text, marginBottom: 10 }}>
            {t('islamicCalendar.fastingTracker')}
          </Text>
          <Text style={{ ...textStyles.body, color: colors.text }}>
            {t('islamicCalendar.totalFasts')}: {stats.totalFasts}
          </Text>
          {stats.inRamadan && (
            <Text style={{ ...textStyles.body, color: colors.text, marginTop: 4 }}>
              {t('islamicCalendar.ramadanProgress', { fasted: stats.ramadanFasted, total: stats.ramadanTotal })}
            </Text>
          )}
        </View>

        <TouchableOpacity
          testID="toggle-reminders-button"
          onPress={onToggleReminders}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...textStyles.body, color: colors.text }}>{t('islamicCalendar.reminders')}</Text>
            <Text style={{ ...textStyles.caption, color: colors.textSecondary, marginTop: 4 }}>
              {t('islamicCalendar.remindersDescription')}
            </Text>
          </View>
          <Feather
            name={remindersEnabled ? 'toggle-right' : 'toggle-left'}
            size={28}
            color={remindersEnabled ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
