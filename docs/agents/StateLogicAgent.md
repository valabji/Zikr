# StateLogicAgent Guidelines

## Objective
Optimize Redux state management in the Zikr app using JavaScript-based implementations with clear documentation and organized structure.

## Current State Analysis

### Existing Store Structure
```javascript
// Current simple reducer
const changeReducer = createReducer({
  "obj": {
    "x": "y",
    "ActiveS": true,
    "Azkar": [],
    "RandomNoti": 2342
  }
}, {
  [change]: (state, action) => {
    state.obj = action.obj
    return state
  },
})
```

## Proposed State Structure

### Feature-Based Organization
```javascript
{
  azkar: {
    items: [],
    favorites: [],
    categories: [],
    currentCategory: null,
    isLoading: false,
    error: null
  },
  prayers: {
    times: {},
    settings: {
      calculationMethod: '',
      madhab: '',
      notifications: {
        enabled: false,
        prayers: {}
      }
    },
    location: {
      coordinates: null,
      searchResults: [],
      isSearching: false
    }
  },
  qibla: {
    direction: null,
    calibration: {
      method: 'auto',
      offset: 0
    }
  },
  settings: {
    theme: 'light',
    language: 'en',
    notifications: {
      enabled: false,
      types: {}
    }
  },
  ui: {
    activeScreen: null,
    modals: {
      isOpen: false,
      type: null
    },
    loading: {}
  }
}
```

## Implementation Guidelines

### 1. Feature Slices
```javascript
// features/azkar/store.js
import { createSlice } from '@reduxjs/toolkit';

const azkarSlice = createSlice({
  name: 'azkar',
  initialState: {
    items: [],
    favorites: [],
    categories: [],
    currentCategory: null,
    isLoading: false,
    error: null
  },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    toggleFavorite: (state, action) => {
      const id = action.payload;
      const index = state.favorites.indexOf(id);
      if (index === -1) {
        state.favorites.push(id);
      } else {
        state.favorites.splice(index, 1);
      }
    }
    // Additional reducers...
  }
});
```

### 2. Selectors
```javascript
// features/azkar/selectors.js

/**
 * Select all Azkar items
 * @param {Object} state - Redux state
 * @returns {Array} Array of Azkar items
 */
export const selectAllAzkar = state => state.azkar.items;

/**
 * Select Azkar items by category
 * @param {Object} state - Redux state
 * @param {string} category - Category name
 * @returns {Array} Filtered Azkar items
 */
export const selectAzkarByCategory = (state, category) => 
  state.azkar.items.filter(item => item.category === category);

/**
 * Select favorite Azkar items
 * @param {Object} state - Redux state
 * @returns {Array} Favorite Azkar items
 */
export const selectFavorites = state => 
  state.azkar.items.filter(item => 
    state.azkar.favorites.includes(item.id)
  );
```

### 3. Actions
```javascript
// features/azkar/actions.js

/**
 * Load Azkar data from storage
 * @returns {Function} Thunk action
 */
export const loadAzkar = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await AsyncStorage.getItem('@azkar_data');
    if (data) {
      dispatch(setItems(JSON.parse(data)));
    }
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};
```

### 4. Root Store Configuration
```javascript
// core/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import azkarReducer from '../../features/azkar/store';
import prayersReducer from '../../features/prayers/store';
import qiblaReducer from '../../features/qibla/store';
import settingsReducer from '../../features/settings/store';
import uiReducer from '../../features/ui/store';

export const store = configureStore({
  reducer: {
    azkar: azkarReducer,
    prayers: prayersReducer,
    qibla: qiblaReducer,
    settings: settingsReducer,
    ui: uiReducer
  }
});
```

## Migration Strategy

1. Create new feature slices
2. Migrate existing state data
3. Update component connections
4. Add selectors progressively
5. Test state transitions

## Best Practices

### State Updates
```javascript
// ❌ Bad - Mutating state directly
const badReducer = (state, action) => {
  state.push(action.payload); // Mutation!
};

// ✅ Good - Immutable update
const goodReducer = (state, action) => {
  return [...state, action.payload];
};
```

### Selector Usage
```javascript
// ❌ Bad - Accessing nested state directly
const Component = () => {
  const items = useSelector(state => state.obj.Azkar);
};

// ✅ Good - Using memoized selector
const Component = () => {
  const items = useSelector(selectAllAzkar);
};
```

## Performance Optimization

1. Use createSelector for derived data
2. Implement proper memoization
3. Split state logically to minimize re-renders
4. Batch related actions when possible

## Testing Guidelines

```javascript
// Example test for a reducer
describe('azkarReducer', () => {
  it('should handle initial state', () => {
    expect(azkarReducer(undefined, {})).toEqual({
      items: [],
      favorites: [],
      categories: [],
      currentCategory: null,
      isLoading: false,
      error: null
    });
  });

  it('should handle toggleFavorite', () => {
    const initialState = {
      favorites: [1, 2]
    };
    const action = toggleFavorite(3);
    const nextState = azkarReducer(initialState, action);
    expect(nextState.favorites).toEqual([1, 2, 3]);
  });
});
```

## Implementation Checklist

- [ ] Create feature slice files
- [ ] Implement selectors
- [ ] Add action creators
- [ ] Update root store
- [ ] Migrate existing state
- [ ] Update components
- [ ] Add tests
- [ ] Document state shape
- [ ] Optimize performance
- [ ] Validate immutability