import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t, getDirectionalMixedSpacing } from '../locales/i18n';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import CompassMethodModal from './CompassMethodModal';

const LocationInfo = ({
    location,
    gpsLocation,
    usingGpsLocation,
    qiblaDirection,
    currentHeading,
    isQiblaAligned,
    compassEnabled,
    compassMethod,
    compassAccuracy,
    availableMethods,
    onSwapCompassMethod
}) => {
    const colors = useColors();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const getBearingText = (direction) => {
        if (direction >= 0 && direction < 22.5) return 'N';
        if (direction >= 22.5 && direction < 67.5) return 'NE';
        if (direction >= 67.5 && direction < 112.5) return 'E';
        if (direction >= 112.5 && direction < 157.5) return 'SE';
        if (direction >= 157.5 && direction < 202.5) return 'S';
        if (direction >= 202.5 && direction < 247.5) return 'SW';
        if (direction >= 247.5 && direction < 292.5) return 'W';
        if (direction >= 292.5 && direction < 337.5) return 'NW';
        return 'N';
    };

    const handleMethodSwap = () => {
        setIsModalVisible(true);
    };

    const handleMethodSelect = (method) => {
        onSwapCompassMethod(method);
        setIsModalVisible(false);
    };

    return (
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
            {/* Location Name */}
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
                    {usingGpsLocation ? (
                        gpsLocation ? `${gpsLocation.city} (${t('qibla.gpsAccurate')})` : t('qibla.gpsLocationName')
                    ) : (
                        location ? `${location.city}, ${location.country}` : t('qibla.unknownLocation')
                    )}
                </Text>
            </View>
            {gpsLocation && usingGpsLocation && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: -20,
                    marginBottom: 10
                }}>
                    <Text style={[
                        PRAYER_CONSTANTS.FONT_STYLES.BODY,
                        {
                            color: colors.secondaryText || colors.text,
                            textAlign: 'center',
                            fontSize: 12,
                            opacity: 0.8,
                            ...getDirectionalMixedSpacing({ marginLeft: 6 })
                        }
                    ]}>
                        {`${gpsLocation.latitude.toFixed(4)}°, ${gpsLocation.longitude.toFixed(4)}°`}
                    </Text>
                </View>
            )}

            {/* Compass Status */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: compassEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: compassEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                shadowColor: compassEnabled ? '#22c55e' : '#ef4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
            }}>
                <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: compassEnabled ? "#22c55e" : "#ef4444",
                    shadowColor: compassEnabled ? '#22c55e' : '#ef4444',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                    elevation: 2,
                    ...getDirectionalMixedSpacing({ marginRight: 8 })
                }} />
                <Feather
                    name="compass"
                    size={16}
                    color={compassEnabled ? "#22c55e" : "#ef4444"}
                    style={{ ...getDirectionalMixedSpacing({ marginRight: 6 }) }}
                />
                <Text style={[
                    PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                    {
                        color: compassEnabled ? "#22c55e" : "#ef4444",
                        fontWeight: '600',
                        fontSize: 13
                    }
                ]}>
                    {compassEnabled ? t('qibla.compassEnabled') : t('qibla.compassDisabled')}
                </Text>
            </View>

            {/* Compass Method and Accuracy - Always show for debugging */}
            <View style={{
                backgroundColor: compassEnabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 107, 53, 0.08)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 15,
                width: '100%',
                borderWidth: 1,
                borderColor: compassEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 107, 53, 0.2)'
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 6
                        }}>
                            <Feather name="compass" size={16} color={colors.BYellow} style={{ opacity: 0.8 }} />
                            <Text style={[
                                PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                                {
                                    color: colors.BYellow,
                                    ...getDirectionalMixedSpacing({ marginLeft: 6 })
                                }
                            ]}>
                                {t('qibla.compassMethod')}
                            </Text>
                        </View>
                        <Text style={[
                            PRAYER_CONSTANTS.FONT_STYLES.SMALL_BODY,
                            {
                                color: compassEnabled ? colors.BYellow : '#FF6B35',
                                fontWeight: '700',
                                lineHeight: 18
                            }
                        ]}>
                            {compassMethod || 'No method available'}
                        </Text>
                    </View>

                    {/* Method Swap Button */}
                    <TouchableOpacity
                        onPress={handleMethodSwap}
                        style={{
                            backgroundColor: compassEnabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 107, 53, 0.15)',
                            borderRadius: 20,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: compassEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 107, 53, 0.2)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}
                    >
                        <Feather name="refresh-cw" size={18} color={compassEnabled ? colors.BYellow : '#FF6B35'} />
                    </TouchableOpacity>
                </View>

                {/* Accuracy section - only show when compass is enabled */}
                {compassEnabled && (
                    <View style={{
                    }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 4
                    }}>
                        <Feather name="target" size={14} color={colors.BYellow} style={{ opacity: 0.7 }} />
                        <Text style={[
                            PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                            {
                                color: colors.BYellow,
                                opacity: 0.7,
                                fontWeight: '500',
                                ...getDirectionalMixedSpacing({ marginLeft: 6 })
                            }
                        ]}>
                            {t('qibla.accuracy')}
                        </Text>
                    </View>
                    <Text style={[
                        PRAYER_CONSTANTS.FONT_STYLES.SMALL_BODY,
                        {
                            color: typeof compassAccuracy === 'number' ?
                                (compassAccuracy <= 5 ? '#22c55e' : compassAccuracy <= 15 ? '#FFC107' : '#ef4444') :
                                colors.BYellow,
                            fontWeight: '600',
                            fontSize: 13
                        }
                    ]}>
                        {typeof compassAccuracy === 'number' ?
                            t(compassAccuracy <= 5 ? 'qibla.accuracyExcellent' :
                                compassAccuracy <= 15 ? 'qibla.accuracyGood' : 'qibla.accuracyPoor',
                                { degrees: compassAccuracy.toFixed(1) }) :
                            String(compassAccuracy) || 'null/undefined'
                        }
                    </Text>
                </View>
                )}
            </View>

            {/* Direction Info Row */}
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
                        {getBearingText(qiblaDirection)}
                    </Text>
                </View>
            </View>

            {/* Compass Method Modal */}
            <CompassMethodModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                availableMethods={availableMethods}
                onMethodSelect={handleMethodSelect}
            />
        </View>
    );
};

export default LocationInfo;
