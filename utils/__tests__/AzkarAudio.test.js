import * as Speech from 'expo-speech';
import azkarAudio, { useAzkarAudio } from '../AzkarAudio';
import { renderHook, act } from '@testing-library/react-native';

describe('AzkarAudio service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    azkarAudio.stop();
  });

  it('does nothing when speaking empty text', () => {
    azkarAudio.speak('a-1', '');
    expect(Speech.speak).not.toHaveBeenCalled();
    expect(azkarAudio.activeKey).toBeNull();
  });

  it('speaks the given text in Arabic and marks the key active', () => {
    azkarAudio.speak('a-1', 'سبحان الله');
    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(
      'سبحان الله',
      expect.objectContaining({ language: 'ar' })
    );
    expect(azkarAudio.activeKey).toBe('a-1');
    expect(azkarAudio.isPlaying).toBe(true);
  });

  it('resets state when playback finishes', () => {
    azkarAudio.speak('a-1', 'سبحان الله');
    const { onDone } = Speech.speak.mock.calls[0][1];
    onDone();
    expect(azkarAudio.activeKey).toBeNull();
    expect(azkarAudio.isPlaying).toBe(false);
  });

  it('ignores a finish callback from a superseded item', () => {
    azkarAudio.speak('a-1', 'سبحان الله');
    const { onDone } = Speech.speak.mock.calls[0][1];
    azkarAudio.speak('a-2', 'الحمد لله');
    onDone();
    expect(azkarAudio.activeKey).toBe('a-2');
    expect(azkarAudio.isPlaying).toBe(true);
  });

  it('toggle stops playback when the same active key is toggled again', () => {
    azkarAudio.speak('a-1', 'سبحان الله');
    azkarAudio.toggle('a-1', 'سبحان الله');
    expect(azkarAudio.activeKey).toBeNull();
    expect(azkarAudio.isPlaying).toBe(false);
  });

  it('toggle starts playback for a new key', () => {
    azkarAudio.toggle('a-1', 'سبحان الله');
    expect(azkarAudio.activeKey).toBe('a-1');
    expect(azkarAudio.isPlaying).toBe(true);
  });

  it('stop clears state and calls Speech.stop', () => {
    azkarAudio.speak('a-1', 'سبحان الله');
    azkarAudio.stop();
    expect(Speech.stop).toHaveBeenCalled();
    expect(azkarAudio.activeKey).toBeNull();
    expect(azkarAudio.isPlaying).toBe(false);
  });

  it('notifies subscribers of state changes and supports unsubscribe', () => {
    const fn = jest.fn();
    const unsubscribe = azkarAudio.subscribe(fn);
    expect(fn).toHaveBeenCalledWith({ activeKey: null, isPlaying: false });
    azkarAudio.speak('a-1', 'سبحان الله');
    expect(fn).toHaveBeenCalledWith({ activeKey: 'a-1', isPlaying: true });
    unsubscribe();
    fn.mockClear();
    azkarAudio.stop();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('useAzkarAudio hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    azkarAudio.stop();
  });

  it('reflects the service state and exposes toggle/stop', () => {
    const { result } = renderHook(() => useAzkarAudio());
    expect(result.current.activeKey).toBeNull();
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.toggle('a-1', 'سبحان الله');
    });

    expect(result.current.activeKey).toBe('a-1');
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.activeKey).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });
});
