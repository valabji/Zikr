# CodeConsistencyAgent Guidelines

## Objective
Establish and enforce consistent coding patterns across the Zikr app codebase while maintaining JavaScript-based implementations.

## Component Structure

### Basic Component Template
```javascript
import * as React from 'react';
import { View } from 'react-native';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';

export default function ComponentName({ prop1, prop2, navigation }) {
  // Theme and localization
  const colors = useColors();
  
  // State management
  const [state, setState] = React.useState(initialValue);
  
  // Effects
  React.useEffect(() => {
    // Side effects logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Event handling logic
  };
  
  // Render helpers
  const renderItem = (item) => {
    return (
      <View>
        {/* Item rendering logic */}
      </View>
    );
  };
  
  // Main render
  return (
    <View style={styles.container}>
      {/* JSX content */}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    // Base styles
  }
});
```

## Code Style Rules

### 1. Imports
```javascript
// React and React Native imports first
import * as React from 'react';
import { View, Text } from 'react-native';

// Third-party library imports
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports: hooks, utils, components
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import CustomButton from '../components/CustomButton';
```

### 2. Component Definition
- Use function declarations for components
- Export components as default when they're the main export
- Use named exports for utility functions and hooks

### 3. State and Effects
- Group related state declarations
- Use descriptive state names
- Keep effects focused and documented
- Clean up side effects properly

### 4. Event Handlers
- Prefix with 'handle' (e.g., handlePress, handleSubmit)
- Keep handlers focused on one responsibility
- Document complex logic

### 5. Styles
- Use StyleSheet.create for better performance
- Group related styles together
- Use theme colors consistently
- Follow RTL-aware spacing patterns

## Naming Conventions

### Files
```
ComponentName.js         # Component files
componentUtils.js       # Utility files
useCustomHook.js       # Hook files
CONSTANTS.js           # Constants files
```

### Variables and Functions
```javascript
// Components
function UserProfile() { }

// Variables
const isLoading = useState(false);
const userData = { };

// Functions
const handleSubmit = () => { };
const formatUserData = (data) => { };

// Constants
const MAX_RETRY_COUNT = 3;
const DEFAULT_SETTINGS = { };
```

## Documentation Standards

### Component Documentation
```javascript
/**
 * Displays user prayer settings with customization options.
 * 
 * @param {Object} props
 * @param {string} props.userId - The ID of the current user
 * @param {Function} props.onSave - Callback when settings are saved
 * @param {Object} props.defaultSettings - Default prayer settings
 */
```

### Function Documentation
```javascript
/**
 * Calculates prayer times based on location and preferences.
 * 
 * @param {Object} location - User's location coordinates
 * @param {number} location.latitude - Latitude coordinate
 * @param {number} location.longitude - Longitude coordinate
 * @param {string} method - Calculation method name
 * @returns {Object} Prayer times for all prayers
 */
```

## Error Handling

### Async Operations
```javascript
try {
  const result = await asyncOperation();
  handleSuccess(result);
} catch (error) {
  console.error('Operation failed:', error);
  handleError(error);
}
```

### Input Validation
```javascript
function validateInput(data) {
  if (!data) {
    throw new Error('Data is required');
  }
  // Additional validation
}
```

## Performance Considerations

1. Use React.memo for pure components
2. Optimize re-renders with useMemo and useCallback
3. Use appropriate key props in lists
4. Lazy load components when possible

## Testing Standards

1. Test file naming: `ComponentName.test.js`
2. Use meaningful test descriptions
3. Group related tests
4. Mock external dependencies
5. Test error cases

## Implementation Checklist

- [ ] Review and update all component files
- [ ] Standardize import ordering
- [ ] Add missing documentation
- [ ] Update error handling
- [ ] Verify style consistency
- [ ] Run linting on all files
- [ ] Update tests to match new standards