import { ADHAN_CATALOG } from '@/constants/AdhanCatalog';

jest.mock('@/utils/quran/QuranSurahAudio', () => ({
  getSurahAudioManifest: jest.fn().mockResolvedValue({ audioUrl: 'https://example.com/audio.mp3' }),
}));
jest.mock('@/utils/notifications/NotificationService', () => ({ __esModule: true, default: { ensurePermission: jest.fn().mockResolvedValue(true) } }));
jest.mock('@/utils/quran/quranDownloadNotifications', () => ({ showDownloadProgress: jest.fn(), hideDownloadProgress: jest.fn() }));

const remoteAdhan = ADHAN_CATALOG.find(a => !a.bundled).id;

describe.each([
  ['adhan', '@/utils/prayer/AdhanDownloader', [remoteAdhan]],
  ['quran', '@/utils/quran/QuranSurahDownloader', ['alafasy', 1]],
])('%s download integrity', (_name, path, args) => {
  let downloader, fs;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      fs = require('expo-file-system/legacy');
      downloader = require(path).default;
    });
    fs.getInfoAsync.mockResolvedValue({ exists: true, size: 50000 });
  });

  it('publishes only a completed temporary download to the playable path', async () => {
    await downloader.start(...args);
    const target = fs.createDownloadResumable.mock.calls[0][1];
    expect(target).toMatch(/\.mp3\.part$/);
    expect(fs.moveAsync).toHaveBeenCalledWith({ from: target, to: target.replace(/\.part$/, '') });
    expect(downloader.isDownloaded(...args)).toBe(true);
  });

  it('rejects a truncated successful HTTP download', async () => {
    fs.getInfoAsync.mockResolvedValue({ exists: true, size: 100 });
    await downloader.start(...args);
    expect(downloader.isDownloaded(...args)).toBe(false);
    expect(fs.moveAsync).not.toHaveBeenCalled();
  });

  it('cancels the network transfer and clears the cancelled state without an error', async () => {
    let started, rejectDownload;
    const entered = new Promise(resolve => { started = resolve; });
    const cancelAsync = jest.fn(async () => { rejectDownload(new Error('cancelled')); });
    fs.createDownloadResumable.mockReturnValueOnce({
      downloadAsync: () => { started(); return new Promise((resolve, reject) => { rejectDownload = reject; }); },
      cancelAsync,
    });
    const run = downloader.start(...args);
    await entered;
    downloader.cancel(...args);
    await run;
    expect(cancelAsync).toHaveBeenCalledTimes(1);
    const key = args.length === 2 ? args.join(':') : args[0];
    expect(downloader.state[key]).toMatchObject({ downloaded: false, downloading: false, error: null });
    expect(fs.moveAsync).not.toHaveBeenCalled();
  });
});
