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

// Mock UI components
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
  Feather: 'Feather',
}));

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

// Mock navigation
// Setup globals
global.__reanimatedWorkletInit = () => {};
