jest.mock('@/utils/quran/QuranSurahAudio', () => ({
  getSurahAudioManifest: jest.fn(() => Promise.resolve({ surah: 108, audioUrl: 'https://cdn/108.mp3', verseTimings: [] })),
}));

jest.mock('@/utils/notifications/NotificationService', () => ({
  __esModule: true,
  default: {
    ensurePermission: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('@/utils/quran/quranDownloadNotifications', () => ({
  showDownloadProgress: jest.fn(() => Promise.resolve()),
  hideDownloadProgress: jest.fn(() => Promise.resolve()),
}));

const load = () => {
  let mod;
  let FileSystem;
  let manifest;
  let notifications;
  jest.isolateModules(() => {
    FileSystem = require('expo-file-system/legacy');
    manifest = require('@/utils/quran/QuranSurahAudio');
    notifications = require('@/utils/quran/quranDownloadNotifications');
    mod = require('@/utils/quran/QuranSurahDownloader').default;
  });
  return { downloader: mod, FileSystem, manifest, notifications };
};

describe('QuranSurahDownloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribe emits an empty snapshot before anything is downloaded', () => {
    const { downloader } = load();
    const fn = jest.fn();
    downloader.subscribe(fn);
    expect(fn.mock.calls[0][0]).toEqual({});
  });

  it('start() downloads a surah for a supported reciter and marks it downloaded', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    await downloader.start('alafasy', 108);
    expect(FileSystem.createDownloadResumable).toHaveBeenCalled();
    expect(downloader.isDownloaded('alafasy', 108)).toBe(true);
  });

  it('start() is a no-op for a reciter without gapless audio', async () => {
    const { downloader, FileSystem, manifest } = load();
    await downloader.start('maher', 108);
    expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();
    expect(manifest.getSurahAudioManifest).not.toHaveBeenCalled();
  });

  it('records an error state when the download throws', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.createDownloadResumable.mockReturnValueOnce({
      downloadAsync: jest.fn(() => Promise.reject(new Error('network down'))),
    });
    await downloader.start('alafasy', 108);
    expect(downloader.isDownloaded('alafasy', 108)).toBe(false);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('getLocalAudioUri returns a uri only when the file exists', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 2000000 });
    expect(await downloader.getLocalAudioUri('alafasy', 108)).toContain('108.mp3');
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
    expect(await downloader.getLocalAudioUri('alafasy', 108)).toBeNull();
  });

  it('checkInstalled marks downloaded surahs found on disk', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    FileSystem.readDirectoryAsync.mockResolvedValueOnce(['108.mp3', 'junk.txt']);
    await downloader.checkInstalled('alafasy');
    expect(downloader.isDownloaded('alafasy', 108)).toBe(true);
  });

  it('countDownloaded counts only downloaded surahs for the given reciter', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    await downloader.start('alafasy', 1);
    await downloader.start('alafasy', 2);
    await downloader.start('husary', 1);
    expect(downloader.countDownloaded('alafasy')).toBe(2);
    expect(downloader.countDownloaded('husary')).toBe(1);
  });

  it('downloadAll downloads every surah and skips a no-op reciter', async () => {
    const { downloader, FileSystem, notifications } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    await downloader.downloadAll('maher');
    expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();

    await downloader.downloadAll('alafasy');
    expect(downloader.countDownloaded('alafasy')).toBe(114);
    expect(downloader.isBulkActive('alafasy')).toBe(false);
    expect(notifications.showDownloadProgress).toHaveBeenCalledWith(
      'quran-download-alafasy-1',
      expect.any(String),
      expect.any(String)
    );
    expect(notifications.hideDownloadProgress).toHaveBeenCalledWith('quran-download-alafasy-1');
  });

  it('cancelAll stops a bulk run in progress and hides the notification', async () => {
    const { downloader, FileSystem, notifications } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    const run = downloader.downloadAll('alafasy');
    expect(downloader.isBulkActive('alafasy')).toBe(true);
    downloader.cancelAll('alafasy');
    expect(downloader.isBulkActive('alafasy')).toBe(false);
    await run;
    expect(downloader.countDownloaded('alafasy')).toBeLessThan(114);
    expect(notifications.hideDownloadProgress).toHaveBeenCalled();
  });

  it('remove deletes the file and resets state', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 2000000 });
    await downloader.start('alafasy', 108);
    await downloader.remove('alafasy', 108);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
    expect(downloader.isDownloaded('alafasy', 108)).toBe(false);
  });
});
