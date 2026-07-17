jest.mock('@/locales/i18n', () => ({
  t: (k, params) => (params ? `${k}:${JSON.stringify(params)}` : k),
  getDirectionalMixedSpacing: () => ({}),
  isRTL: () => false,
}));

jest.mock('@/components/CustomHeader', () => () => null);

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import WirdPlannerScreen from '@/screens/WirdPlannerScreen';
import { _resetForTests } from '@/utils/WirdPlanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

const buildNav = () => ({ navigate: jest.fn(), goBack: jest.fn() });

describe('WirdPlannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTests();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('renders without crashing and shows the no-goal-set message initially', async () => {
    const { getByTestId, getByText } = render(<WirdPlannerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('wird-planner-screen')).toBeTruthy());
    expect(getByText('wirdPlanner.noGoalSet')).toBeTruthy();
  });

  it('sets a daily goal and reveals progress sections', async () => {
    const { getByTestId, queryByText } = render(<WirdPlannerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('wird-goal-input')).toBeTruthy());

    fireEvent.changeText(getByTestId('wird-goal-input'), '20');
    fireEvent.press(getByTestId('wird-save-goal-button'));

    await waitFor(() => expect(queryByText('wirdPlanner.noGoalSet')).toBeNull());
    expect(getByTestId('wird-log-1')).toBeTruthy();
    expect(getByTestId('wird-log-5')).toBeTruthy();
    expect(getByTestId('wird-log-10')).toBeTruthy();
  });

  it('logs pages via quick-log buttons', async () => {
    const { getByTestId } = render(<WirdPlannerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('wird-goal-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('wird-goal-input'), '5');
    fireEvent.press(getByTestId('wird-save-goal-button'));

    await waitFor(() => expect(getByTestId('wird-log-5')).toBeTruthy());
    fireEvent.press(getByTestId('wird-log-5'));
    await waitFor(() => expect(getByTestId('wird-reset-khatmah-button')).toBeTruthy());
  });

  it('resets the khatmah after confirming the alert', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const confirm = buttons.find((b) => b.text === 'counter.yes');
      confirm?.onPress?.();
    });

    const { getByTestId } = render(<WirdPlannerScreen navigation={buildNav()} />);
    await waitFor(() => expect(getByTestId('wird-goal-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('wird-goal-input'), '5');
    fireEvent.press(getByTestId('wird-save-goal-button'));

    await waitFor(() => expect(getByTestId('wird-reset-khatmah-button')).toBeTruthy());
    fireEvent.press(getByTestId('wird-reset-khatmah-button'));
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
