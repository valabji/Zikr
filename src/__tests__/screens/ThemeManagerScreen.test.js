import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ThemeManagerScreen from '@/screens/theme/ThemeManagerScreen';
import { ThemeContext } from '@/constants/Colors';
import { themes } from '@/constants/themes';
import { THEME_COLOR_KEYS } from '@/utils/theme/ThemeManager';

jest.mock('@/components/CustomHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomHeader({ title }) {
    return <Text testID="header-title">{title}</Text>;
  };
});

const makeCustomTheme = () => {
  const theme = { name: 'My Theme', nameAr: 'سمتي', custom: true, fontFamily: 'Cairo_400Regular' };
  THEME_COLOR_KEYS.forEach((key) => { theme[key] = '#112233'; });
  return theme;
};

const makeContext = (overrides = {}) => ({
  theme: 'goldOnDark',
  setTheme: jest.fn(),
  themes,
  customThemes: {},
  hiddenThemes: [],
  saveCustomTheme: jest.fn(),
  deleteCustomTheme: jest.fn(),
  setThemeHidden: jest.fn(),
  reloadCustomThemes: jest.fn(),
  isThemeLoaded: true,
  variant: null,
  autoVariant: true,
  lockedVariant: null,
  setAutoVariantEnabled: jest.fn(),
  lockVariant: jest.fn(),
  ...overrides,
});

const renderScreen = (ctx, navigation = { navigate: jest.fn(), goBack: jest.fn() }) => ({
  navigation,
  ...render(
    <ThemeContext.Provider value={ctx}>
      <ThemeManagerScreen navigation={navigation} />
    </ThemeContext.Provider>
  ),
});

describe('ThemeManagerScreen', () => {
  it('renders a row per built-in theme', () => {
    const { getByTestId } = renderScreen(makeContext());
    Object.keys(themes).forEach((id) => {
      expect(getByTestId(`theme-row-${id}`)).toBeTruthy();
    });
  });

  it('renders custom themes in their own section', () => {
    const ctx = makeContext({ customThemes: { custom_abc: makeCustomTheme() } });
    const { getByTestId } = renderScreen(ctx);
    expect(getByTestId('theme-row-custom_abc')).toBeTruthy();
  });

  it('applies a theme from the actions modal', async () => {
    const ctx = makeContext();
    const { getByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-row-originalGreen'));
    fireEvent.press(getByTestId('theme-action-apply'));
    await waitFor(() => expect(ctx.setTheme).toHaveBeenCalledWith('originalGreen'));
  });

  it('hides an inactive theme', async () => {
    const ctx = makeContext();
    const { getByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-row-paige'));
    fireEvent.press(getByTestId('theme-action-hide'));
    await waitFor(() => expect(ctx.setThemeHidden).toHaveBeenCalledWith('paige', true));
  });

  it('disables hiding the active theme', () => {
    const ctx = makeContext();
    const { getByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-row-goldOnDark'));
    expect(getByTestId('theme-action-hide').props.accessibilityState.disabled).toBe(true);
    expect(getByTestId('theme-action-hide').props.onPress).toBeUndefined();
  });

  it('shows edit and delete only for custom themes', () => {
    const ctx = makeContext({ customThemes: { custom_abc: makeCustomTheme() } });
    const { getByTestId, queryByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-row-originalGreen'));
    expect(queryByTestId('theme-action-edit')).toBeNull();
    expect(queryByTestId('theme-action-delete')).toBeNull();
  });

  it('creates a clone and opens the editor', async () => {
    const ctx = makeContext();
    const { getByTestId, navigation } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-new'));
    await waitFor(() => expect(ctx.saveCustomTheme).toHaveBeenCalled());
    const [id, saved] = ctx.saveCustomTheme.mock.calls[0];
    expect(id).toMatch(/^custom_/);
    expect(saved.custom).toBe(true);
    expect(navigation.navigate).toHaveBeenCalledWith('ThemeEditor', { themeId: id });
  });

  it('does not reload custom themes when import is canceled', async () => {
    const DocumentPicker = require('expo-document-picker');
    const ctx = makeContext();
    const { getByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-import'));
    await waitFor(() => expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled());
    expect(ctx.reloadCustomThemes).not.toHaveBeenCalled();
  });
});
