import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { getCurrentLanguage, isRTL } from '../locales/i18n';

/**
 * Custom hook for RTL support
 * Provides RTL state and helper functions for both web and mobile platforms
 */
export const useRTL = () => {
  const [isRTLLayout, setIsRTLLayout] = useState(isRTL());
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    // Update RTL state when language changes
    const updateRTLState = () => {
      const rtl = isRTL();
      const lang = getCurrentLanguage();
      setIsRTLLayout(rtl);
      setCurrentLang(lang);
    };

    // Check for language changes periodically (for web platform)
    const interval = setInterval(updateRTLState, 100);

    return () => clearInterval(interval);
  }, []);

  // Helper functions for RTL-aware styling
  const getRTLStyle = (ltrStyle, rtlStyle) => {
    return isRTLLayout ? rtlStyle : ltrStyle;
  };

  // Get text alignment based on RTL
  const getTextAlign = (defaultAlign = 'left') => {
    if (defaultAlign === 'left') {
      return isRTLLayout ? 'right' : 'left';
    }
    if (defaultAlign === 'right') {
      return isRTLLayout ? 'left' : 'right';
    }
    return defaultAlign;
  };

  // Get flex direction for RTL
  const getFlexDirection = (defaultDirection = 'row') => {
    if (defaultDirection === 'row') {
      return isRTLLayout ? 'row-reverse' : 'row';
    }
    return defaultDirection;
  };

  // Get margin/padding adjustments for RTL
  // Note: Only needed for web - mobile platforms handle RTL automatically via I18nManager
  const getDirectionalSpacing = (leftValue, rightValue) => {
    // On mobile, let I18nManager handle RTL automatically
    if (Platform.OS !== 'web') {
      return { marginLeft: leftValue, marginRight: rightValue };
    }
    
    // On web, manually handle RTL
    return isRTLLayout ? 
      { marginRight: leftValue, marginLeft: rightValue } :
      { marginLeft: leftValue, marginRight: rightValue };
  };

  // Get padding adjustments for RTL
  const getDirectionalPadding = (leftValue, rightValue) => {
    // On mobile, let I18nManager handle RTL automatically
    if (Platform.OS !== 'web') {
      return { paddingLeft: leftValue, paddingRight: rightValue };
    }
    
    // On web, manually handle RTL
    return isRTLLayout ? 
      { paddingRight: leftValue, paddingLeft: rightValue } :
      { paddingLeft: leftValue, paddingRight: rightValue };
  };

  // Get mixed margin and padding adjustments
  const getDirectionalMixedSpacing = ({ 
    marginLeft, 
    marginRight, 
    paddingLeft, 
    paddingRight 
  }) => {
    // On mobile, let I18nManager handle RTL automatically
    if (Platform.OS !== 'web') {
      const spacing = {};
      if (marginLeft !== undefined) spacing.marginLeft = marginLeft;
      if (marginRight !== undefined) spacing.marginRight = marginRight;
      if (paddingLeft !== undefined) spacing.paddingLeft = paddingLeft;
      if (paddingRight !== undefined) spacing.paddingRight = paddingRight;
      return spacing;
    }
    
    // On web, manually handle RTL
    const spacing = {};
    
    if (marginLeft !== undefined || marginRight !== undefined) {
      if (isRTLLayout) {
        if (marginLeft !== undefined) spacing.marginRight = marginLeft;
        if (marginRight !== undefined) spacing.marginLeft = marginRight;
      } else {
        if (marginLeft !== undefined) spacing.marginLeft = marginLeft;
        if (marginRight !== undefined) spacing.marginRight = marginRight;
      }
    }
    
    if (paddingLeft !== undefined || paddingRight !== undefined) {
      if (isRTLLayout) {
        if (paddingLeft !== undefined) spacing.paddingRight = paddingLeft;
        if (paddingRight !== undefined) spacing.paddingLeft = paddingRight;
      } else {
        if (paddingLeft !== undefined) spacing.paddingLeft = paddingLeft;
        if (paddingRight !== undefined) spacing.paddingRight = paddingRight;
      }
    }
    
    return spacing;
  };

  // Get position adjustments for RTL
  const getDirectionalPosition = (leftValue, rightValue) => {
    return isRTLLayout ?
      { right: leftValue, left: rightValue } :
      { left: leftValue, right: rightValue };
  };

  // Get transform for icons that need to flip in RTL
  const getIconTransform = (shouldFlip = true) => {
    return shouldFlip && isRTLLayout ? [{ scaleX: -1 }] : [];
  };

  return {
    isRTL: isRTLLayout,
    currentLanguage: currentLang,
    getRTLStyle,
    getTextAlign,
    getFlexDirection,
    getDirectionalSpacing,
    getDirectionalPadding,
    getDirectionalMixedSpacing,
    getDirectionalPosition,
    getIconTransform,
  };
};

// Helper component for RTL-aware containers
export const RTLContainer = ({ children, style, ...props }) => {
  const { isRTL } = useRTL();
  
  const containerStyle = {
    ...style,
    flexDirection: isRTL ? 'row-reverse' : 'row',
  };

  return (
    <div style={containerStyle} {...props}>
      {children}
    </div>
  );
};

// Helper component for RTL-aware text
export const RTLText = ({ children, style, align = 'auto', ...props }) => {
  const { getTextAlign } = useRTL();
  
  const textStyle = {
    ...style,
    textAlign: align === 'auto' ? getTextAlign() : align,
  };

  return (
    <span style={textStyle} {...props}>
      {children}
    </span>
  );
};

export default useRTL;
