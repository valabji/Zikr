import React from 'react';
import { View, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

const QiblaCompass = ({
  qiblaDirection,
  isQiblaAligned,
  compassEnabled,
  compassRotationValue,
  rotationValue
}) => {
  const colors = useColors();

  return (
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
              height: '100%',
              width: '100%',
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
              top: 20,
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
              top: 40,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5
            }} />
          </Animated.View>

          {/* Center Hub */}
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
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 24,
              minHeight: 24
            }} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default QiblaCompass;
