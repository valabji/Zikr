// Global Platform mock - must be at the very top
global.Platform = {
  OS: 'ios',
  select: (options) => options.ios || options.native || options.default,
};

// Mock critical modules early
jest.mock('react-native/Libraries/Utilities/Platform', () => global.Platform);

// Mock React Native modules that depend on native code
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => ({
    addItem: jest.fn(),
    removeItem: jest.fn(),
  })),
  get: jest.fn(() => null),
}));

// Mock AccessibilityInfo to fix React Native Testing Library issues
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
  isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
  isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
}));

// Mock RCTUIManager for React Native Testing Library
jest.mock('react-native/Libraries/ReactNative/UIManager', () => ({
  blur: jest.fn(),
  focus: jest.fn(),
  measureInWindow: jest.fn((node, callback) => {
    callback(0, 0, 100, 100);
  }),
  measure: jest.fn((node, callback) => {
    callback(0, 0, 100, 100, 0, 0);
  }),
  measureLayout: jest.fn((node, relativeNode, onFail, onSuccess) => {
    onSuccess(0, 0, 100, 100);
  }),
  getViewManagerConfig: jest.fn(),
}));

// Mock flatten utility that's used by React Native Testing Library
jest.mock('react-native/Libraries/StyleSheet/flattenStyle', () => {
  return function flattenStyle(style) {
    if (style === null || typeof style !== "object") {
      return style;
    }
    if (Array.isArray(style)) {
      return style.reduce((acc, item) => Object.assign(acc, flattenStyle(item)), {});
    }
    return style;
  };
});

// Mock react-native-swiper
jest.mock('react-native-swiper', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollBy: jest.fn(),
      goTo: jest.fn(),
    }));
    return React.createElement('View', { ...props, testID: props.testID || 'swiper' }, props.children);
  });
});

// Mock react-native-web-swiper
jest.mock('react-native-web-swiper', () => ({
  default: require('react').forwardRef((props, ref) => {
    const React = require('react');
    React.useImperativeHandle(ref, () => ({
      goTo: jest.fn(),
    }));
    return React.createElement('View', { ...props, testID: props.testID || 'web-swiper' }, props.children);
  })
}));

// Setup global mock for StyleSheet flatten
global.flattenStyle = jest.fn((style) => {
  if (style === null || typeof style !== "object") {
    return style;
  }
  if (Array.isArray(style)) {
    return style.reduce((acc, item) => Object.assign(acc, flattenStyle(item)), {});
  }
  return style;
});

// Mock NativeDeviceInfo to prevent getConstants errors
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => ({
  getConstants: () => ({
    Dimensions: { window: { width: 375, height: 667 } },
    fontScale: 1,
  }),
}));

// Mock NativeSettingsManager for Settings
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  getConstants: () => ({}),
  setValues: jest.fn(),
  deleteValues: jest.fn(),
}));

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  TouchableOpacity: 'TouchableOpacity',
  State: {},
  BaseButton: 'BaseButton',
  ScrollView: 'ScrollView',
}));

// Mock Audio and Sound
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      })),
    },
  },
}));

// Mock Sound functionality and utils
jest.mock('./utils/Sounds', () => ({
  useAudio: jest.fn(() => ({
    playSound: jest.fn(),
    stopSound: jest.fn(),
    playClick: jest.fn(),
    volume: 0.5,
    setClickVolume: jest.fn(),
  })),
  playKikSound: jest.fn(),
  playLongKikSound: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// Mock React Native Linking, Alert, and Clipboard
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Components/Clipboard/Clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
}));

// Mock expo-sensors
jest.mock('expo-sensors', () => ({
  Magnetometer: {
    addListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    setUpdateInterval: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
  Feather: 'Feather',
}));

// Mock React Native Modal
jest.mock('react-native', () => {
  const React = require('react');
  
  // Helper to create mocked components with proper accessibility properties
  const createMockComponent = (name) => React.forwardRef((props, ref) => {
    // Ensure accessibility properties are defined
    const accessibilityProps = {
      accessible: true,
      accessibilityLabel: props.accessibilityLabel || '',
      accessibilityRole: props.accessibilityRole || 'none',
      accessibilityState: props.accessibilityState || {},
      accessibilityValue: props.accessibilityValue || {},
      ...props
    };
    
    return React.createElement(name, { ...accessibilityProps, ref }, props.children);
  });
  
  const ReactNative = {
    Platform: global.Platform,
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => {
        if (style === null || typeof style !== "object") {
          return style;
        }
        if (Array.isArray(style)) {
          return style.reduce((acc, item) => Object.assign(acc, ReactNative.StyleSheet.flatten(item)), {});
        }
        return style;
      }),
    },
    Modal: createMockComponent('Modal'),
    View: createMockComponent('View'),
    SafeAreaView: createMockComponent('SafeAreaView'),
    Text: createMockComponent('Text'),
    TouchableOpacity: createMockComponent('TouchableOpacity'),
    ScrollView: createMockComponent('ScrollView'),
    Image: createMockComponent('Image'),
    ImageBackground: createMockComponent('ImageBackground'),
    FlatList: createMockComponent('FlatList'),
    TextInput: createMockComponent('TextInput'),
    TouchableHighlight: createMockComponent('TouchableHighlight'),
    I18nManager: {
      isRTL: false,
      forceRTL: jest.fn(),
      allowRTL: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    AsyncStorage: {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
    },
    Alert: {
      alert: jest.fn(),
    },
    BackHandler: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
  
  return ReactNative;
});

// Mock react-native-community/slider
jest.mock('@react-native-community/slider', () => 'Slider');

// Mock problematic React Native components
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  addListener: jest.fn(),
  removeAllListeners: jest.fn(),
}));

// Mock KeyboardAvoidingView and related components
jest.mock('react-native/Libraries/Components/Keyboard/KeyboardAvoidingView', () => 'KeyboardAvoidingView');
jest.mock('react-native/Libraries/Modal/Modal', () => 'Modal');
jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => 'ScrollView');

// Mock React Native components globally
global.React = global.React || {};
global.React.Modal = 'Modal';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    toggleDrawer: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => ({
    Navigator: jest.fn(props => props.children),
    Screen: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock Redux Store
jest.mock('./redux/store', () => {
  let testState = {
    obj: {
      Azkar: [{
        id: 1,
        name: 'Test Zikr',
        count: '1',
        zekr: 'Test Zikr Text',
        category: 'Test Category',
        description: 'Test Description',
        reference: 'Test Reference',
        fav: false
      }]
    }
  };
  
  return {
    mystore: {
      getState: jest.fn(() => testState),
      dispatch: jest.fn((action) => {
        switch (action.type) {
          case 'SET_AZKAR':
            testState = {
              ...testState,
              obj: {
                ...testState.obj,
                Azkar: action.payload
              }
            };
            break;
          case 'RESET_STATE':
            testState = {
              obj: {
                Azkar: []
              }
            };
            break;
          case 'change':
            testState = {
              ...testState,
              ...action.obj ? { obj: action.obj } : {}
            };
            break;
        }
      }),
      subscribe: jest.fn(),
    },
  };
});

// Setup globals
global.__reanimatedWorkletInit = () => {};
