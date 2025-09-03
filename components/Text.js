import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONT_FAMILY, textStyles } from '../constants/Fonts';

// Custom Text component that automatically applies Cairo font
export const Text = ({ style, children, ...props }) => {
  return (
    <RNText 
      style={[styles.defaultText, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
};

// Custom TextInput component that automatically applies Cairo font
export const TextInput = React.forwardRef(({ style, ...props }, ref) => {
  const { TextInput: RNTextInput } = require('react-native');
  
  return (
    <RNTextInput 
      ref={ref}
      style={[styles.defaultText, style]} 
      {...props}
    />
  );
});

// Styled text variants
export const TitleText = ({ style, ...props }) => (
  <Text style={[textStyles.title, style]} {...props} />
);

export const SubtitleText = ({ style, ...props }) => (
  <Text style={[textStyles.subtitle, style]} {...props} />
);

export const BodyText = ({ style, ...props }) => (
  <Text style={[textStyles.body, style]} {...props} />
);

export const CaptionText = ({ style, ...props }) => (
  <Text style={[textStyles.caption, style]} {...props} />
);

export const HeaderText = ({ style, ...props }) => (
  <Text style={[textStyles.header, style]} {...props} />
);

export const NavigationText = ({ style, ...props }) => (
  <Text style={[textStyles.navigation, style]} {...props} />
);

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: FONT_FAMILY,
  },
});

export default Text;
