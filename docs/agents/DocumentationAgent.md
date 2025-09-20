# DocumentationAgent Guidelines

## Objective
Create and maintain comprehensive documentation for the Zikr app, ensuring clarity and consistency across the codebase.

## Documentation Structure

### 1. Project README
```markdown
# Zikr - Islamic Prayer & Dhikr App

## Overview
Mobile application for Islamic prayers, dhikr tracking, and qibla direction, built with React Native and Expo.

## Features
- Prayer time calculations
- Digital dhikr counter
- Qibla compass
- Multi-language support
- Theme customization
- Prayer notifications

## Tech Stack
- React Native with Expo SDK 53
- React Navigation 7
- Redux Toolkit
- AsyncStorage
- Custom theming system
- i18n localization

## Getting Started

### Prerequisites
- Node.js 14+
- Expo CLI
- Android Studio/Xcode for mobile development

### Installation
\`\`\`bash
# Install dependencies
yarn install

# Start development server
yarn start
\`\`\`

### Running Tests
\`\`\`bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage
\`\`\`

## Project Structure
\`\`\`
src/
├── features/       # Feature modules
├── core/          # Core application code
├── common/        # Shared components and utilities
└── assets/        # Static assets
\`\`\`

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License
MIT License - See [LICENSE](./LICENSE) for details.
```

### 2. Component Documentation

#### Template
```javascript
/**
 * @component ComponentName
 * @description Brief description of the component's purpose
 * 
 * @example
 * ```jsx
 * <ComponentName
 *   prop1="value"
 *   prop2={42}
 *   onEvent={() => {}}
 * />
 * ```
 * 
 * @property {string} prop1 - Description of prop1
 * @property {number} prop2 - Description of prop2
 * @property {Function} onEvent - Callback when event occurs
 */
```

#### Example: PrayerTimeCard
```javascript
/**
 * @component PrayerTimeCard
 * @description Displays prayer time information with optional next prayer highlight
 * 
 * @example
 * ```jsx
 * <PrayerTimeCard
 *   prayer="Fajr"
 *   time="5:30 AM"
 *   isNext={true}
 * />
 * ```
 * 
 * @property {string} prayer - Name of the prayer
 * @property {string} time - Formatted prayer time
 * @property {boolean} [isNext=false] - Whether this is the next prayer
 */
```

### 3. Hook Documentation

#### Template
```javascript
/**
 * @hook useHookName
 * @description Purpose and usage of the hook
 * 
 * @param {Type} param1 - Description of first parameter
 * @param {Type} param2 - Description of second parameter
 * 
 * @returns {Object} Description of return value
 * @property {Type} property1 - Description of first return property
 * @property {Type} property2 - Description of second return property
 * 
 * @example
 * ```jsx
 * const { property1, property2 } = useHookName(param1, param2);
 * ```
 */
```

#### Example: usePrayerTimes
```javascript
/**
 * @hook usePrayerTimes
 * @description Manages prayer time calculations based on location and settings
 * 
 * @param {Object} location - User's location coordinates
 * @param {number} location.latitude - Latitude coordinate
 * @param {number} location.longitude - Longitude coordinate
 * @param {Object} settings - Prayer calculation settings
 * @param {string} settings.method - Calculation method name
 * 
 * @returns {Object} Prayer times and status
 * @property {Object} times - Calculated prayer times
 * @property {boolean} loading - Loading status
 * @property {Error} error - Any calculation errors
 * 
 * @example
 * ```jsx
 * const { times, loading, error } = usePrayerTimes(
 *   { latitude: 21.4225, longitude: 39.8262 },
 *   { method: 'MWL' }
 * );
 * ```
 */
```

### 4. Utility Documentation

#### Template
```javascript
/**
 * @function functionName
 * @description Purpose of the utility function
 * 
 * @param {Type} param1 - Description of first parameter
 * @param {Type} param2 - Description of second parameter
 * @returns {Type} Description of return value
 * 
 * @example
 * ```javascript
 * const result = functionName(param1, param2);
 * ```
 */
```

#### Example: formatPrayerTime
```javascript
/**
 * @function formatPrayerTime
 * @description Formats a prayer time based on user locale and preferences
 * 
 * @param {Date} time - Prayer time as Date object
 * @param {string} locale - User's locale
 * @param {boolean} use24Hour - Whether to use 24-hour format
 * @returns {string} Formatted time string
 * 
 * @example
 * ```javascript
 * const formatted = formatPrayerTime(
 *   new Date('2025-09-20T05:30:00'),
 *   'en',
 *   false
 * ); // Returns "5:30 AM"
 * ```
 */
```

### 5. API Documentation

#### Example: Prayer Time Calculation
```javascript
/**
 * Prayer Time Calculation API
 * 
 * Endpoints:
 * GET /api/prayer-times
 * 
 * Query Parameters:
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} method - Calculation method
 * 
 * Response:
 * ```json
 * {
 *   "fajr": "05:30",
 *   "dhuhr": "12:30",
 *   "asr": "15:45",
 *   "maghrib": "18:15",
 *   "isha": "19:45"
 * }
 * ```
 */
```

## Feature Documentation

### Example: Qibla Compass Feature
```markdown
# Qibla Compass Feature

## Overview
The Qibla compass helps users find the direction of the Kaaba for prayer.

## Components
- QiblaCompass: Main compass view
- CompassCalibration: Compass calibration UI
- LocationPicker: Location selection interface

## Configuration
- Default location: Mecca (21.4225° N, 39.8262° E)
- Magnetic declination compensation
- Multiple calibration methods

## Usage
1. Allow location access
2. Calibrate compass if needed
3. Follow direction indicator

## Technical Details
- Uses device magnetometer
- Compensates for true north
- Handles edge cases (poles, date line)
```

## Style Guide Documentation

### Example: Theme System
```markdown
# Theme System

## Colors
- Primary: #4CAF50
- Secondary: #2196F3
- Background: #FFFFFF
- Text: #000000

## Typography
- Heading 1: 24px / bold
- Body: 16px / regular
- Caption: 14px / regular

## Spacing
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

## Components
- Cards: 8px border radius
- Buttons: 4px border radius
- Inputs: 2px border width
```

## Implementation Checklist

### 1. Project Documentation
- [ ] Update README.md
- [ ] Create CONTRIBUTING.md
- [ ] Document installation steps
- [ ] Add usage examples

### 2. Code Documentation
- [ ] Document components
- [ ] Document hooks
- [ ] Document utilities
- [ ] Add JSDoc comments

### 3. Feature Documentation
- [ ] Document prayer features
- [ ] Document qibla compass
- [ ] Document notifications
- [ ] Document settings

### 4. API Documentation
- [ ] Document data structures
- [ ] Document state management
- [ ] Document async operations
- [ ] Document error handling

### 5. Style Guide
- [ ] Document theme system
- [ ] Document component patterns
- [ ] Document layout guidelines
- [ ] Document accessibility

## Success Criteria

- [ ] All code is documented
- [ ] Documentation is up-to-date
- [ ] Examples are provided
- [ ] Style guide is complete
- [ ] Installation guide works
- [ ] Feature documentation is clear