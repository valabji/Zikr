import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsActions } from '@/hooks/settings/useSettingsActions';
import { APP_KEYS } from '@/constants/StorageKeys';

function setup() {
  const navigation = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
  const form = {
    tempScreen: 'Fav', initialScreen: 'Fav', hasUnsavedForm: () => true,
    applyForm: jest.fn().mockResolvedValue(),
  };
  const vibration = { hasUnsavedVibration: () => false, applyVibration: jest.fn().mockResolvedValue() };
  const hook = renderHook(() => useSettingsActions({ navigation, playClick: jest.fn(), form, vibration }));
  return { hook, navigation, form };
}

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.getItem.mockImplementation(key => Promise.resolve(key === APP_KEYS.FIRST_TIME_SETTINGS ? 'visited' : 'ar'));
});

it('navigates back only once when saving through the unsaved changes prompt', async () => {
  const { hook, navigation } = setup();
  await act(async () => {});
  await act(async () => { await hook.result.current.handleBackPress(); });
  const save = Alert.alert.mock.calls.at(-1)[2][2];
  await act(async () => { await save.onPress(); });
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});

it('keeps unsaved settings open when saving fails', async () => {
  const { hook, navigation, form } = setup();
  form.applyForm.mockRejectedValue(new Error('disk full'));
  await act(async () => {});
  await act(async () => { await hook.result.current.handleBackPress(); });
  const save = Alert.alert.mock.calls.at(-1)[2][2];
  await act(async () => { await save.onPress(); });
  expect(navigation.goBack).not.toHaveBeenCalled();
});

it('does not navigate away while an unsaved changes prompt is already visible', async () => {
  const { hook, navigation } = setup();
  await act(async () => {});
  await act(async () => { await hook.result.current.handleBackPress(); });
  await act(async () => { await hook.result.current.handleBackPress(); });
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledTimes(1);
});
