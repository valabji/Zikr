import React from 'react';
import { ImageBackground, View } from 'react-native';
import { useColors } from '../constants/Colors';

export const BackgroundSvg2 = ({ color, style, testID }) => {
  const colors = useColors();
  
  return (
    <View 
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }, style]}
      testID={testID}
    >
      <ImageBackground
        source={require('../assets/images/bg2.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        {/* Tint overlay to match theme - using primary color for tint */}
        <View 
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            opacity: 0.7,
          }}
        />
      </ImageBackground>
    </View>
  );
};
