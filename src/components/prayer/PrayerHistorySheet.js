import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import moment from 'moment-timezone';
import { useColors } from '@/constants/Colors';
import { t, getDirectionalMixedSpacing } from '@/locales/i18n';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { MANDATORY_PRAYERS } from '@/utils/prayer/PrayerCheckIn';

function HistoryRow({ colors, dateKey, offsetDays, day, count, total, complete }) {
  const label = offsetDays === 0
    ? t('prayerTimes.today')
    : offsetDays === 1
      ? t('prayerTimes.yesterday')
      : moment(dateKey).format('ddd, MMM D');

  return (
    <View
      testID={`history-row-${dateKey}`}
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
        {MANDATORY_PRAYERS.map((p) => (
          <Feather
            key={p}
            name={day[p] ? 'check-circle' : 'circle'}
            size={14}
            color={complete ? colors.currentPrayer : colors.BYellow}
            style={{ opacity: day[p] ? 1 : 0.35, ...getDirectionalMixedSpacing({ marginLeft: 4 }) }}
          />
        ))}
        <Text style={{
          color: colors.BYellow,
          fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
          fontFamily: "Cairo_400Regular",
          opacity: 0.8,
          ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.TINY_PADDING }),
        }}>
          {`${count}/${total}`}
        </Text>
      </View>
    </View>
  );
}

export default function PrayerHistorySheet({ visible, onClose, history }) {
  const colors = useColors();
  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayBackground }}>
          <TouchableWithoutFeedback>
            <View
              testID="prayer-history-sheet"
              style={{
                backgroundColor: colors.DGreen,
                borderTopLeftRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                borderTopRightRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                maxHeight: '80%',
                paddingBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                }}
              >
                <Text style={{
                  color: colors.BYellow,
                  ...PRAYER_CONSTANTS.FONT_STYLES.SUBTITLE,
                  fontFamily: "Cairo_400Regular",
                }}>
                  {t('prayerTimes.history')}
                </Text>
                <TouchableOpacity onPress={onClose} testID="prayer-history-close" style={{ padding: 4 }}>
                  <Feather name="x" size={22} color={colors.BYellow} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: PRAYER_CONSTANTS.SPACING.CARD_PADDING }}>
                {history.map((row) => (
                  <HistoryRow key={row.dateKey} colors={colors} {...row} />
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
