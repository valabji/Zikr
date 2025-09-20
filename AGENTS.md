# Zikr App - Agent Guidelines

## Build/Lint/Test Commands

### Build Commands
- `yarn build:android` - Build Android APK using EAS
- `expo start` - Start Expo development server
- `expo run:android` - Run on Android device/emulator
- `expo run:ios` - Run on iOS simulator
- `yarn web` - Start web development server
- `yarn predeploy` - Build for web deployment
- `yarn deploy` - Deploy to GitHub Pages

### Test Commands
- `yarn test` - Run all tests once
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn test:update` - Update Jest snapshots
- `yarn test:ci` - Run tests for CI (Jest with --ci flag)

### Running Single Tests
- `jest path/to/test.js` - Run specific test file
- `jest -t "test name"` - Run tests matching pattern
- `jest __tests__/components/Component.test.js` - Run specific component test

## Code Style Guidelines

### Imports
```javascript
// React/React Native imports first
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Third-party libraries
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports (components, utils, constants)
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import CustomButton from '../components/CustomButton';
```

### Naming Conventions
- **Components**: PascalCase (`CustomHeader`, `PrayerTimesScreen`)
- **Functions/Variables**: camelCase (`calculateQiblaDirection`, `prayerTimes`)
- **Constants**: UPPER_SNAKE_CASE (`KAABA_COORDINATES`, `DEFAULT_CALCULATION_METHOD`)
- **Files**: PascalCase for components/screens, camelCase for utils/constants
- **Test files**: `ComponentName.test.js` in `__tests__/` directories

### Component Structure
```javascript
export default function ComponentName({ prop1, prop2, navigation }) {
  const colors = useColors();
  const [state, setState] = React.useState(initialValue);

  // Effects and handlers
  React.useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handlePress = () => {
    // Event handlers
  };

  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
}
```

### Styling Patterns
- Use theme-based colors via `useColors()` hook
- Inline styles with theme integration
- RTL-aware spacing using `getDirectionalSpacing()` and `getDirectionalMixedSpacing()`
- Consistent elevation/shadow patterns for cards/headers

### Error Handling
```javascript
try {
  const result = await asyncOperation();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Graceful fallback or user notification
}
```

### Async Operations
- Use `async/await` over Promise chains
- Always wrap in try-catch blocks
- Provide loading states and error fallbacks
- Use `React.useEffect` for data fetching

### Type Documentation
```javascript
/**
 * Calculate Qibla direction from coordinates
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {number} Qibla direction in degrees
 */
export const calculateQiblaDirection = (latitude, longitude) => {
  // Implementation
};
```

### RTL (Right-to-Left) Support
- Use `isRTL()` and `getRTLTextAlign()` for text alignment
- Use `getDirectionalSpacing()` for margins/padding
- Support both Arabic and English text layouts
- Test components in both LTR and RTL modes

### Testing Patterns
- Use `@testing-library/react-native` for component testing
- Include `testID` props for element selection
- Test user interactions and state changes
- Mock external dependencies (AsyncStorage, navigation, etc.)
- Follow existing test structure in `__tests__/` directories

### File Organization
- `components/` - Reusable UI components
- `screens/` - Screen components for navigation
- `constants/` - App constants, themes, colors
- `utils/` - Utility functions and helpers
- `locales/` - Internationalization files
- `redux/` - State management
- `assets/` - Images, fonts, sounds
- `__tests__/` - Test files mirroring source structure

### Key Dependencies
- React Native 0.79.5 with Expo SDK 53
- React Navigation for routing
- Redux Toolkit for state management
- AsyncStorage for persistence
- React Native SVG for vector graphics
- Adhan library for prayer time calculations
- i18n-js for internationalization

### Performance Considerations
- Use `React.memo()` for expensive components
- Optimize image loading and caching
- Implement proper key props in lists
- Use `useMemo()` for expensive calculations
- Profile with Flipper or React DevTools

### Git Workflow
- Use descriptive commit messages
- Follow conventional commit format when possible
- Test before committing
- Use feature branches for new functionality
- Keep commits focused and atomic