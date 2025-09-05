import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

const QiblaInstructions = ({
  compassEnabled,
  isQiblaAligned,
  isQiblaClose,
  qiblaDirection,
  onRetryCompass,
  onNavigateToSettings
}) => {
  const colors = useColors();

  // Determine alignment color and text
  const getAlignmentColor = () => {
    if (isQiblaAligned) return '#22c55e'; // Green - aligned
    if (isQiblaClose) return '#FFC107'; // Yellow - close
    return '#FF6B35'; // Orange - not close
  };

  const getAlignmentText = () => {
    if (isQiblaAligned) return t('qibla.aligned');
    if (isQiblaClose) return t('qibla.closeToQibla');
    return t('qibla.arrowIndicator');
  };

  return (
    <>
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
            backgroundColor: getAlignmentColor(),
            borderRadius: 2,
            ...getDirectionalMixedSpacing({marginRight:8})
          }} />
          <Text style={{
            color: getAlignmentColor(),
            fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
            fontFamily: "Cairo_400Regular",
            opacity: 0.9
          }}>
            {getAlignmentText()}
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
            justifyContent: 'space-between',
            marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
            
            {/* Retry Button */}
            <TouchableOpacity
              onPress={onRetryCompass}
              style={{
                backgroundColor: 'rgba(255, 193, 7, 0.25)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginLeft: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 193, 7, 0.3)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Feather name="refresh-ccw" size={14} color="#FFC107" />
                <Text style={{
                  color: '#FFC107',
                  fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
                  fontFamily: "Cairo_600SemiBold",
                  fontWeight: '600',
                  ...getDirectionalMixedSpacing({ marginLeft: 4 })
                }}>
                  {t('qibla.retry')}
                </Text>
              </View>
            </TouchableOpacity>
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
        onPress={onNavigateToSettings}
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
    </>
  );
};

export default QiblaInstructions;
