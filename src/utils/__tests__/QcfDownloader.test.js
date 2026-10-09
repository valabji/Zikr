import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

function loadDownloader() {
  let downloader;
  jest.isolateModules(() => { downloader = require('@/utils/quran/QcfDownloader').default; });
  return downloader;
}

describe('QCF font downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.removeItem.mockResolvedValue();
    AsyncStorage.setItem.mockResolvedValue();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
  });

  it('rejects HTTP error pages and does not mark the font pack installed', async () => {
    FileSystem.downloadAsync.mockResolvedValue({ status: 404 });
    const downloader = loadDownloader();
    await expect(downloader.start('v2')).rejects.toThrow('Invalid font download');
    expect(downloader.isInstalled('v2')).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('waits for in-flight workers after an error before allowing a retry', async () => {
    let rejectFirst;
    let finishOthers;
    const first = new Promise((_, reject) => { rejectFirst = reject; });
    const others = new Promise((resolve) => { finishOthers = resolve; });
    FileSystem.downloadAsync.mockReturnValue(others).mockReturnValueOnce(first);
    const downloader = loadDownloader();
    const run = downloader.start('v2');
    const rejection = expect(run).rejects.toThrow('offline');
    for (let i = 0; i < 10; i++) await Promise.resolve();
    rejectFirst(new Error('offline'));
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(downloader.state.v2.downloading).toBe(true);
    await downloader.start('v2');
    expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(6);
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000 });
    finishOthers({ status: 200 });
    await rejection;
    expect(downloader.state.v2.downloading).toBe(false);
  });
});
