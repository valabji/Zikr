# UIRefactorAgent Guidelines

## Objective
Optimize UI components in the Zikr app by identifying reusable patterns, improving component composition, and ensuring consistent styling.

## Component Analysis

### Current Component Structure
```
components/
├── AzkarOnePageScroll.js
├── AzkarSwiper.js
├── BackgroundSvg1.js
├── BackgroundSvg2.js
├── CHeader.js
├── CompassMethodModal.js
├── CustomToggle.js
└── ...
```

## Reusable Component Patterns

### 1. Base Components

#### Typography Components
```javascript
// common/components/Text.js
export function Heading({ children, ...props }) {
  const colors = useColors();
  return (
    <Text
      style={[
        styles.heading,
        { color: colors.text },
        props.style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Subtitle({ children, ...props }) {
  // Similar pattern for other text variants
}
```

#### Button Components
```javascript
// common/components/Button.js
export function PrimaryButton({ onPress, title, ...props }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        props.style
      ]}
      onPress={onPress}
      {...props}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}
```

#### Input Components
```javascript
// common/components/Input.js
export function TextInput({ error, ...props }) {
  const colors = useColors();
  return (
    <View>
      <RNTextInput
        style={[
          styles.input,
          { borderColor: error ? colors.error : colors.border },
          props.style
        ]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
```

### 2. Layout Components

#### Card Component
```javascript
// common/components/Card.js
export function Card({ children, ...props }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow
        },
        props.style
      ]}
    >
      {children}
    </View>
  );
}
```

#### Container Components
```javascript
// common/components/Container.js
export function Screen({ children, ...props }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, props.style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
```

### 3. Feature-Specific Components

#### Prayer Time Display
```javascript
// features/prayers/components/PrayerTimeCard.js
export function PrayerTimeCard({ prayer, time, isNext }) {
  const colors = useColors();
  return (
    <Card
      style={[
        styles.prayerCard,
        isNext && styles.nextPrayer
      ]}
    >
      <Text style={styles.prayerName}>{prayer}</Text>
      <Text style={styles.prayerTime}>{time}</Text>
    </Card>
  );
}
```

## Styling Guidelines

### 1. Theme Integration
```javascript
// core/theme/index.js
export const lightTheme = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  border: '#E0E0E0',
  error: '#FF5252'
};

export const darkTheme = {
  // Dark theme colors
};
```

### 2. Spacing System
```javascript
// core/theme/spacing.js
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

// Usage in styles
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm
  }
});
```

### 3. Typography Scale
```javascript
// core/theme/typography.js
export const typography = {
  heading1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold'
  },
  body: {
    fontSize: 16,
    lineHeight: 24
  }
};
```

## Screen Composition

### Main Screen Example
```javascript
// features/azkar/screens/MainScreen.js
export default function MainScreen() {
  return (
    <Screen>
      <Header />
      <CategoryList />
      <FavoriteSection />
      <RecentlyRead />
    </Screen>
  );
}
```

## Implementation Strategy

### 1. Component Audit
- [ ] Identify common UI patterns
- [ ] List components for extraction
- [ ] Document component dependencies

### 2. Base Component Creation
- [ ] Typography system
- [ ] Button variations
- [ ] Input components
- [ ] Layout primitives

### 3. Feature Components
- [ ] Prayer-specific components
- [ ] Qibla compass components
- [ ] Settings components
- [ ] Navigation components

### 4. Screen Refactoring
- [ ] Break down large screens
- [ ] Implement composition pattern
- [ ] Add proper prop types
- [ ] Update styling

## Testing Approach

### Component Tests
```javascript
describe('PrayerTimeCard', () => {
  it('renders prayer information correctly', () => {
    const { getByText } = render(
      <PrayerTimeCard
        prayer="Fajr"
        time="5:30 AM"
        isNext={true}
      />
    );
    
    expect(getByText('Fajr')).toBeTruthy();
    expect(getByText('5:30 AM')).toBeTruthy();
  });
});
```

## Performance Optimizations

1. Implement proper component memoization
2. Use layout animations for smooth transitions
3. Lazy load non-critical components
4. Optimize image assets

## Success Criteria

- [ ] All common components extracted
- [ ] Consistent styling across app
- [ ] Improved component reusability
- [ ] Reduced code duplication
- [ ] Performance improvements
- [ ] Comprehensive test coverage