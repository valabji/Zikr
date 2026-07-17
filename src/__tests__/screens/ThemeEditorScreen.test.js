import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ThemeEditorScreen from '@/screens/theme/ThemeEditorScreen';
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
  const theme = {
    name: 'My Theme',
    nameAr: 'سمتي',
    custom: true,
    fontFamily: 'Cairo_400Regular',
    headerGradient: ['#111111', '#222222'],
  };
  THEME_COLOR_KEYS.forEach((key) => { theme[key] = '#112233'; });
  return theme;
};

const makeContext = (overrides = {}) => ({
  theme: 'goldOnDark',
  setTheme: jest.fn(),
  themes,
  customThemes: { custom_abc: makeCustomTheme() },
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

const renderScreen = (ctx, themeId = 'custom_abc') => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  return {
    navigation,
    ...render(
      <ThemeContext.Provider value={ctx}>
        <ThemeEditorScreen navigation={navigation} route={{ params: { themeId } }} />
      </ThemeContext.Provider>
    ),
  };
};

describe('ThemeEditorScreen', () => {
  it('renders name inputs and a row per color key', () => {
    const { getByTestId } = renderScreen(makeContext());
    expect(getByTestId('theme-name-en').props.value).toBe('My Theme');
    expect(getByTestId('theme-name-ar').props.value).toBe('سمتي');
    THEME_COLOR_KEYS.forEach((key) => {
      expect(getByTestId(`theme-color-${key}`)).toBeTruthy();
    });
  });

  it('renders gradient rows when the theme has a header gradient', () => {
    const { getByTestId } = renderScreen(makeContext());
    expect(getByTestId('theme-gradient-0')).toBeTruthy();
    expect(getByTestId('theme-gradient-1')).toBeTruthy();
  });

  it('renders pattern and click sound controls', () => {
    const { getByTestId, queryByTestId } = renderScreen(makeContext());
    expect(getByTestId('theme-pattern-color')).toBeTruthy();
    expect(getByTestId('theme-pattern-hide-toggle')).toBeTruthy();
    expect(getByTestId('theme-pick-clickSound')).toBeTruthy();
    expect(queryByTestId('theme-clear-clickSound')).toBeNull();
  });

  it('saves the edited theme and goes back', async () => {
    const ctx = makeContext();
    const { getByTestId, navigation } = renderScreen(ctx);
    fireEvent.changeText(getByTestId('theme-name-en'), 'Renamed');
    fireEvent.press(getByTestId('theme-save'));
    await waitFor(() => expect(ctx.saveCustomTheme).toHaveBeenCalled());
    const [id, saved] = ctx.saveCustomTheme.mock.calls[0];
    expect(id).toBe('custom_abc');
    expect(saved.name).toBe('Renamed');
    expect(saved.custom).toBe(true);
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('blocks saving when the name is empty', async () => {
    const ctx = makeContext();
    const { getByTestId, navigation } = renderScreen(ctx);
    fireEvent.changeText(getByTestId('theme-name-en'), '   ');
    fireEvent.press(getByTestId('theme-save'));
    await waitFor(() => expect(navigation.goBack).not.toHaveBeenCalled());
    expect(ctx.saveCustomTheme).not.toHaveBeenCalled();
  });

  it('picks a color through the picker modal', async () => {
    const ctx = makeContext();
    const { getByTestId } = renderScreen(ctx);
    fireEvent.press(getByTestId('theme-color-accent'));
    fireEvent.changeText(getByTestId('color-picker-hex'), '#FF0000');
    fireEvent.press(getByTestId('color-picker-done'));
    fireEvent.press(getByTestId('theme-save'));
    await waitFor(() => expect(ctx.saveCustomTheme).toHaveBeenCalled());
    const saved = ctx.saveCustomTheme.mock.calls[0][1];
    expect(saved.accent.toLowerCase()).toBe('#ff0000');
  });

  it('renders only the header when the theme id is unknown', () => {
    const { queryByTestId } = renderScreen(makeContext(), 'missing');
    expect(queryByTestId('theme-editor-screen')).toBeNull();
  });
});
