# CompassMethodModal Component

A well-designed modal component that replaces React Native's Alert for selecting compass methods in the Zikr app.

## Features

- **Smooth Animations**: Uses `Animated.View` for fade and scale transitions
- **Responsive Design**: Adapts to different screen sizes with max width constraints
- **Theme Integration**: Fully integrated with the app's color system and theming
- **Accessibility**: Proper touch targets and visual feedback
- **RTL Support**: Uses the app's directional spacing utilities
- **Clean UI**: Modern design with icons, descriptions, and visual hierarchy

## Usage

```jsx
import CompassMethodModal from './components/CompassMethodModal';

const [modalVisible, setModalVisible] = useState(false);

<CompassMethodModal
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    availableMethods={['location', 'magnetometer']}
    onMethodSelect={(method) => {
        console.log('Selected:', method);
        handleMethodChange(method);
    }}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | Yes | Controls modal visibility |
| `onClose` | function | Yes | Called when modal should be closed |
| `availableMethods` | array | Yes | Array of available compass methods |
| `onMethodSelect` | function | Yes | Called when a method is selected |

## Available Methods

- `'auto'` - Always available, auto-selects best method
- `'location'` - GPS/Location based compass
- `'magnetometer'` - Device magnetometer sensor

## Design Features

### Visual Elements
- **Header**: Title with compass icon and close button
- **Method Options**: Each method has an icon, title, and description
- **Visual Feedback**: Different colors for each method type
- **Cancel Button**: Clear way to dismiss without selection

### Animations
- **Fade In/Out**: Smooth background overlay transition
- **Scale Animation**: Modal scales in with spring animation
- **Touch Feedback**: Button press animations

### Responsive Design
- **Max Width**: Prevents modal from being too wide on large screens
- **Padding**: Consistent spacing that adapts to screen size
- **Height Limit**: Prevents modal from exceeding 80% of screen height

## Comparison with Alert

### Before (React Native Alert)
```jsx
Alert.alert(
    t('qibla.switchCompassMethod'),
    t('qibla.chooseMethod'),
    [
        { text: t('qibla.autoSelect'), onPress: () => onSwapCompassMethod('auto') },
        { text: t('qibla.gpsLocation'), onPress: () => onSwapCompassMethod('location') },
        { text: t('qibla.magnetometer'), onPress: () => onSwapCompassMethod('magnetometer') },
        { text: t('qibla.cancel'), style: 'cancel' }
    ]
);
```

### After (Custom Modal)
```jsx
<CompassMethodModal
    visible={isModalVisible}
    onClose={() => setIsModalVisible(false)}
    availableMethods={availableMethods}
    onMethodSelect={handleMethodSelect}
/>
```

## Benefits

1. **Consistent Design**: Matches app's visual style
2. **Better UX**: More informative with descriptions and icons
3. **Cross-platform**: Identical experience on iOS and Android
4. **Customizable**: Easy to modify colors, animations, and layout
5. **Accessible**: Better accessibility than native alerts
6. **Maintainable**: Easier to test and maintain than Alert dialogs

## File Structure

```
components/
├── CompassMethodModal.js       # Main modal component
├── CompassMethodModalDemo.js   # Demo/example usage
└── LocationInfo.js             # Updated to use modal instead of Alert
```
