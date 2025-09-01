import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Component to load RTL CSS styles on web platform
 * This ensures RTL styles are loaded before the app renders
 */
const RTLStyleLoader = () => {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if RTL stylesheet is already loaded
      const existingLink = document.getElementById('rtl-styles');
      if (!existingLink) {
        // Create and append the RTL stylesheet
        const link = document.createElement('link');
        link.id = 'rtl-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        // In production, you might want to load this from a CDN or build process
        // For now, we'll add the styles directly
        const style = document.createElement('style');
        style.id = 'rtl-styles';
        style.textContent = `
          /* RTL Web Support Styles - Inline for better loading */
          html[dir="rtl"] {
            direction: rtl;
            text-align: right;
            font-family: 'Cairo', 'Helvetica Neue', Arial, sans-serif;
          }
          
          html[dir="ltr"] {
            direction: ltr;
            text-align: left;
          }
          
          html[dir="rtl"] body {
            direction: rtl;
            text-align: right;
          }
          
          html[dir="rtl"] input,
          html[dir="rtl"] textarea {
            text-align: right;
          }
          
          html[dir="ltr"] input,
          html[dir="ltr"] textarea {
            text-align: left;
          }
          
          html[dir="rtl"] .flex-row-reverse {
            flex-direction: row-reverse;
          }
          
          html[dir="rtl"] .text-right {
            text-align: right;
          }
          
          html[dir="ltr"] .text-left {
            text-align: left;
          }
          
          /* Navigation RTL support */
          html[dir="rtl"] .drawer-content {
            left: auto;
            right: 0;
          }
          
          /* Animation adjustments */
          html[dir="rtl"] .slide-animation {
            transform: scaleX(-1);
          }
        `;
        
        document.head.appendChild(style);
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

export default RTLStyleLoader;
