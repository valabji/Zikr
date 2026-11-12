import React from 'react';
import { ImageBackground, View } from 'react-native';
import { useColors } from '@/constants/Colors';

const FALLBACKS = {
  1: require('@assets/images/bg.jpg'),
  2: require('@assets/images/bg2.jpg'),
};

export const ThemedBackground = ({ variant = 1, style, testID }) => {
  const colors = useColors();
  const themeImage = variant === 2 ? colors.bgImage2 : colors.bgImage1;

  return (
    <View
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }, style]}
      testID={testID}
    >
      <ImageBackground
        source={themeImage ? { uri: themeImage } : FALLBACKS[variant]}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
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
