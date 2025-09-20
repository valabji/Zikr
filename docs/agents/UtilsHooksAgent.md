# UtilsHooksAgent Guidelines

## Objective
Optimize utility functions and custom hooks in the Zikr app for better reusability, performance, and maintainability while staying within JavaScript constraints.

## Custom Hooks Analysis

### Current Hooks Structure
```
hooks/
├── useQiblaCompass.js
├── useRTL.js
└── ...

utils/
├── FontSize.js
├── load.js
├── PrayerUtils.js
├── restart.js
└── ...
```

## Optimized Hook Patterns

### 1. Data Management Hooks

#### useAsyncStorage
```javascript
/**
 * Custom hook for handling AsyncStorage operations
 * @param {string} key - Storage key
 * @param {*} initialValue - Default value if no stored data
 */
export function useAsyncStorage(key, initialValue) {
  const [data, setData] = React.useState(initialValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Load data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        setData(stored ? JSON.parse(stored) : initialValue);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [key]);

  // Save data
  const saveData = async (newData) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (err) {
      setError(err);
    }
  };

  return { data, loading, error, saveData };
}
```

#### usePrayerTimes
```javascript
/**
 * Hook for managing prayer time calculations
 * @param {Object} location - User's location
 * @param {Object} settings - Calculation settings
 */
export function usePrayerTimes(location, settings) {
  const [times, setTimes] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (location) {
      try {
        const calculated = calculatePrayerTimes(location, settings);
        setTimes(calculated);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  }, [location, settings]);

  return { times, loading, error };
}
```

### 2. UI State Hooks

#### useThemeMode
```javascript
export function useThemeMode() {
  const [mode, setMode] = React.useState('light');

  const toggleMode = React.useCallback(() => {
    setMode(current => current === 'light' ? 'dark' : 'light');
  }, []);

  React.useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('@theme_mode')
      .then(saved => {
        if (saved) setMode(saved);
      });
  }, []);

  return { mode, toggleMode };
}
```

#### useNotifications
```javascript
export function useNotifications() {
  const [permissions, setPermissions] = React.useState(false);
  const [settings, setSettings] = React.useState({});

  const requestPermissions = async () => {
    // Implementation
  };

  const scheduleNotification = async (prayer, time) => {
    // Implementation
  };

  return {
    permissions,
    settings,
    requestPermissions,
    scheduleNotification
  };
}
```

## Utility Functions

### 1. Date and Time Utils
```javascript
// utils/dateTime.js

/**
 * Format time string based on locale
 * @param {Date} date - Date object to format
 * @param {string} locale - Locale string
 * @returns {string} Formatted time string
 */
export function formatTime(date, locale = 'en') {
  // Implementation
}

/**
 * Get next prayer time
 * @param {Object} prayerTimes - Prayer times object
 * @returns {Object} Next prayer info
 */
export function getNextPrayer(prayerTimes) {
  // Implementation
}
```

### 2. Location Utils
```javascript
// utils/location.js

/**
 * Format coordinates for display
 * @param {Object} coords - Coordinates object
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(coords) {
  // Implementation
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First coordinate point
 * @param {Object} point2 - Second coordinate point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(point1, point2) {
  // Implementation
}
```

### 3. String Utils
```javascript
// utils/strings.js

/**
 * Clean and normalize Arabic text
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
export function normalizeArabicText(text) {
  // Implementation
}

/**
 * Get direction based on language
 * @param {string} text - Input text
 * @returns {string} 'rtl' or 'ltr'
 */
export function getTextDirection(text) {
  // Implementation
}
```

## Error Handling

### Custom Error Hook
```javascript
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    console.error(error);
    setError(error);
    // Additional error handling logic
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
```

## Testing Strategy

### Hook Testing
```javascript
describe('useAsyncStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('loads initial value when no stored data', async () => {
    const { result } = renderHook(() => 
      useAsyncStorage('test-key', 'default')
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBe('default');
  });
});
```

### Utility Testing
```javascript
describe('dateTime utils', () => {
  it('formats time correctly', () => {
    const date = new Date('2025-09-20T05:30:00');
    expect(formatTime(date, 'en')).toBe('5:30 AM');
  });
});
```

## Implementation Checklist

### Hooks Migration
- [ ] Identify common patterns in existing hooks
- [ ] Create shared hook utilities
- [ ] Update components to use new hooks
- [ ] Add proper error handling
- [ ] Add comprehensive tests

### Utils Migration
- [ ] Categorize utility functions
- [ ] Create modular utility files
- [ ] Update import paths
- [ ] Add JSDoc documentation
- [ ] Create test suites

## Performance Optimization

1. Implement proper dependency arrays in hooks
2. Add memoization where beneficial
3. Optimize expensive calculations
4. Use appropriate cleanup in effects

## Success Criteria

- [ ] Reduced code duplication
- [ ] Improved error handling
- [ ] Comprehensive test coverage
- [ ] Clear documentation
- [ ] Optimized performance
- [ ] Better maintainability