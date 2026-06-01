import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFontSize, saveFontSize } from '../FontSize';

describe('FontSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFontSize', () => {
    it('returns the parsed stored value', async () => {
      AsyncStorage.getItem.mockResolvedValue('22');
      await expect(getFontSize()).resolves.toBe(22);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@fontSize');
    });

    it('returns the default (18) when nothing is stored', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      await expect(getFontSize()).resolves.toBe(18);
    });

    it('returns the default and warns on storage error', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      AsyncStorage.getItem.mockRejectedValue(new Error('boom'));
      await expect(getFontSize()).resolves.toBe(18);
      warn.mockRestore();
    });
  });

  describe('saveFontSize', () => {
    it('persists as string and returns true', async () => {
      AsyncStorage.setItem.mockResolvedValue();
      await expect(saveFontSize(20)).resolves.toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@fontSize', '20');
    });

    it('returns false and warns on storage error', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      AsyncStorage.setItem.mockRejectedValue(new Error('boom'));
      await expect(saveFontSize(20)).resolves.toBe(false);
      warn.mockRestore();
    });
  });
});
