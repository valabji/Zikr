import { Platform } from 'react-native';

/**
 * Web-specific utilities for RTL support
 */

export const isWeb = Platform.OS === 'web';

/**
 * Apply RTL direction to document
 */
export const applyRTLToDocument = (isRTL) => {
  if (isWeb && typeof document !== 'undefined') {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (isRTL) {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', 'ar');
      htmlElement.style.direction = 'rtl';
      bodyElement.style.direction = 'rtl';
      htmlElement.classList.add('rtl');
      htmlElement.classList.remove('ltr');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', 'en');
      htmlElement.style.direction = 'ltr';
      bodyElement.style.direction = 'ltr';
      htmlElement.classList.add('ltr');
      htmlElement.classList.remove('rtl');
    }
  }
};

/**
 * Get CSS class names for RTL support
 */
export const getRTLClassName = (isRTL, baseClass = '') => {
  const rtlClass = isRTL ? 'rtl' : 'ltr';
  return baseClass ? `${baseClass} ${rtlClass}` : rtlClass;
};

/**
 * Create RTL-aware inline styles
 */
export const createRTLStyle = (isRTL, ltrStyles = {}, rtlStyles = {}) => {
  return {
    ...ltrStyles,
    ...(isRTL ? rtlStyles : {}),
  };
};

/**
 * Flip margin/padding values for RTL
 * Note: Only needed for web - mobile platforms handle RTL automatically via I18nManager
 */
export const flipSpacing = (isRTL, spacing) => {
  // On mobile, let I18nManager handle RTL automatically
  if (!isWeb || !isRTL || !spacing) return spacing;
  
  const flipped = { ...spacing };
  
  // Flip left/right margins
  if (spacing.marginLeft !== undefined && spacing.marginRight !== undefined) {
    flipped.marginLeft = spacing.marginRight;
    flipped.marginRight = spacing.marginLeft;
  } else if (spacing.marginLeft !== undefined) {
    flipped.marginRight = spacing.marginLeft;
    delete flipped.marginLeft;
  } else if (spacing.marginRight !== undefined) {
    flipped.marginLeft = spacing.marginRight;
    delete flipped.marginRight;
  }
  
  // Flip left/right paddings
  if (spacing.paddingLeft !== undefined && spacing.paddingRight !== undefined) {
    flipped.paddingLeft = spacing.paddingRight;
    flipped.paddingRight = spacing.paddingLeft;
  } else if (spacing.paddingLeft !== undefined) {
    flipped.paddingRight = spacing.paddingLeft;
    delete flipped.paddingLeft;
  } else if (spacing.paddingRight !== undefined) {
    flipped.paddingLeft = spacing.paddingRight;
    delete flipped.paddingRight;
  }
  
  return flipped;
};

/**
 * Flip position values for RTL
 * Note: Only needed for web - mobile platforms handle RTL automatically via I18nManager
 */
export const flipPosition = (isRTL, position) => {
  // On mobile, let I18nManager handle RTL automatically
  if (!isWeb || !isRTL || !position) return position;
  
  const flipped = { ...position };
  
  // Flip left/right positions
  if (position.left !== undefined && position.right !== undefined) {
    flipped.left = position.right;
    flipped.right = position.left;
  } else if (position.left !== undefined) {
    flipped.right = position.left;
    delete flipped.left;
  } else if (position.right !== undefined) {
    flipped.left = position.right;
    delete flipped.right;
  }
  
  return flipped;
};

/**
 * Get text alignment for RTL
 */
export const getTextAlignment = (isRTL, defaultAlign = 'left') => {
  if (defaultAlign === 'center') return 'center';
  
  if (isRTL) {
    return defaultAlign === 'left' ? 'right' : 'left';
  }
  
  return defaultAlign;
};

/**
 * Get RTL-aware text alignment style
 * Returns 'auto' for mobile (handled by I18nManager) and proper alignment for web
 */
export const getRTLTextAlign = (defaultAlign = 'left') => {
  // On mobile, let I18nManager handle RTL automatically
  if (!isWeb) {
    return 'auto';
  }
  
  // On web, get current RTL state from i18n and return proper alignment
  try {
    const { isRTL: getCurrentRTL } = require('../locales/i18n');
    return getTextAlignment(getCurrentRTL(), defaultAlign);
  } catch (error) {
    // Fallback if i18n is not available
    return defaultAlign;
  }
};

/**
 * Get flex direction for RTL
 */
export const getFlexDirection = (isRTL, direction = 'row') => {
  if (direction === 'row' && isRTL) {
    return 'row-reverse';
  }
  
  return direction;
};

/**
 * Apply RTL-aware styles to web elements
 */
export const applyWebRTLStyles = (isRTL) => {
  if (!isWeb || typeof document === 'undefined') return;
  
  // Add global RTL class to body for CSS targeting
  document.body.className = document.body.className
    .replace(/\b(rtl|ltr)\b/g, '')
    .trim() + ` ${isRTL ? 'rtl' : 'ltr'}`;
  
  // Apply direction to common input elements
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.style.direction = isRTL ? 'rtl' : 'ltr';
    input.style.textAlign = isRTL ? 'right' : 'left';
  });
};

export default {
  isWeb,
  applyRTLToDocument,
  getRTLClassName,
  createRTLStyle,
  flipSpacing,
  flipPosition,
  getTextAlignment,
  getRTLTextAlign,
  getFlexDirection,
  applyWebRTLStyles,
};
