import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { getCurrentLanguage, isRTL } from '@/locales/i18n';

export const useRTL = () => {
  const [isRTLLayout, setIsRTLLayout] = useState(isRTL());
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage?.());

  useEffect(() => {
    const updateRTLState = () => {
      setIsRTLLayout(isRTL());
      setCurrentLang(getCurrentLanguage?.());
    };
    const interval = setInterval(updateRTLState, 100);
    return () => clearInterval(interval);
  }, []);

  const getRTLStyle = (ltrStyle, rtlStyle) => {
    return isRTLLayout ? rtlStyle : ltrStyle;
  };

  // Native treats textAlign left/right as logical in RTL; only web needs a manual flip
  const getTextAlign = (defaultAlign = 'left') => {
    if (Platform.OS !== 'web' || !isRTLLayout) return defaultAlign;
    if (defaultAlign === 'left') return 'right';
    if (defaultAlign === 'right') return 'left';
    return defaultAlign;
  };

  // Native swaps physical left/right props in RTL automatically; only web needs a manual flip
  const getDirectionalSpacing = (leftValue, rightValue) => {
    if (Platform.OS !== 'web') {
      return { marginLeft: leftValue, marginRight: rightValue };
    }
    return isRTLLayout ?
      { marginRight: leftValue, marginLeft: rightValue } :
      { marginLeft: leftValue, marginRight: rightValue };
  };

  const getDirectionalPadding = (leftValue, rightValue) => {
    if (Platform.OS !== 'web') {
      return { paddingLeft: leftValue, paddingRight: rightValue };
    }
    return isRTLLayout ?
      { paddingRight: leftValue, paddingLeft: rightValue } :
      { paddingLeft: leftValue, paddingRight: rightValue };
  };

  const getDirectionalMixedSpacing = ({
    marginLeft,
    marginRight,
    paddingLeft,
    paddingRight
  }) => {
    const flip = Platform.OS === 'web' && isRTLLayout;
    const spacing = {};
    if (marginLeft !== undefined) spacing[flip ? 'marginRight' : 'marginLeft'] = marginLeft;
    if (marginRight !== undefined) spacing[flip ? 'marginLeft' : 'marginRight'] = marginRight;
    if (paddingLeft !== undefined) spacing[flip ? 'paddingRight' : 'paddingLeft'] = paddingLeft;
    if (paddingRight !== undefined) spacing[flip ? 'paddingLeft' : 'paddingRight'] = paddingRight;
    return spacing;
  };

  return {
    isRTL: isRTLLayout,
    currentLanguage: currentLang,
    getRTLStyle,
    getTextAlign,
    getDirectionalSpacing,
    getDirectionalPadding,
    getDirectionalMixedSpacing,
  };
};

export default useRTL;
