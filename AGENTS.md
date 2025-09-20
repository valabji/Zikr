# Zikr App - Agent Guidelines

## Build/Test Commands
- `yarn test` - Run all tests
- `yarn test:watch` - Watch mode
- `jest path/to/test.js` - Single test file
- `jest -t "pattern"` - Tests matching pattern
- `expo start` - Development server
- `yarn build:android` - Android build

## Code Style Guidelines
- **Imports**: React/React Native first, then third-party, then local
- **Naming**: PascalCase components, camelCase functions/variables, UPPER_SNAKE_CASE constants
- **Components**: Use `useColors()` hook, RTL-aware spacing with `getDirectionalSpacing()`
- **Error Handling**: Always use try-catch with async/await
- **RTL Support**: Use `isRTL()`, `getRTLTextAlign()`, `getDirectionalSpacing()`
- **Testing**: `@testing-library/react-native`, include `testID` props, mock dependencies
- **File Structure**: `components/`, `screens/`, `constants/`, `utils/`, `locales/`, `redux/`, `__tests__/`

## Key Dependencies
- React Native 0.79.5 + Expo SDK 53
- React Navigation, Redux Toolkit, AsyncStorage
- React Native SVG, Adhan, i18n-js

## Performance
- Use `React.memo()`, `useMemo()`, proper list keys
- Theme-based colors, RTL-aware layouts