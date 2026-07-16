import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';

const CustomToggle = ({
  value, 
  onValueChange, 
  size = 24,
  style,
  activeColor,
  inactiveColor,
  backgroundColor,
  icon = 'bell'
}) => {
  const colors = useColors();

  const activeIconColor = activeColor || colors.BYellow;
  const inactiveIconColor = inactiveColor || colors.BYellow + '40';
  const bgColor = backgroundColor || colors.BGreen;
  
  const toggleWidth = size * 2.2;
  const toggleHeight = size * 1.2;
  const thumbSize = size * 0.9;
  
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        {
          width: toggleWidth,
          height: toggleHeight,
          borderRadius: toggleHeight / 2,
          backgroundColor: value ? activeIconColor + '30' : inactiveIconColor + '20',
          borderWidth: 1,
          borderColor: value ? activeIconColor : inactiveIconColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: value ? 'flex-end' : 'flex-start',
          paddingHorizontal: 4,
        },
        style
      ]}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: value ? activeIconColor : inactiveIconColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <Feather
          name={icon}
          size={thumbSize * 0.6}
          color={value ? bgColor : colors.BGreen}
        />
      </View>
    </TouchableOpacity>
  );
};

export default CustomToggle;
