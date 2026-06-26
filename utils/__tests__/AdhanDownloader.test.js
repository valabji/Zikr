import { ADHAN_CATALOG } from '../../constants/AdhanCatalog';

const load = () => {
  let mod;
  let FileSystem;
  jest.isolateModules(() => {
    FileSystem = require('expo-file-system/legacy');
    mod = require('../AdhanDownloader').default;
  });
  return { downloader: mod, FileSystem };
};

const firstRemote = ADHAN_CATALOG.find((a) => !a.bundled).id;

describe('AdhanDownloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribe emits an initial snapshot with a blank state per downloadable entry', () => {
    const { downloader } = load();
    const fn = jest.fn();
    downloader.subscribe(fn);
    const snap = fn.mock.calls[0][0];
    ADHAN_CATALOG.forEach((a) => {
      if (a.bundled) {
        expect(snap[a.id]).toBeUndefined();
      } else {
        expect(snap[a.id]).toEqual({ downloaded: false, downloading: false, progress: 0, error: null });
      }
    });
  });

  it('start() downloads a remote adhan and marks it downloaded', async () => {
    const { downloader } = load();
    await downloader.start(firstRemote);
    expect(downloader.isDownloaded(firstRemote)).toBe(true);
  });

  it('start() is a no-op for the bundled default', async () => {
    const { downloader, FileSystem } = load();
    await downloader.start('default');
    expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();
  });

  it('start() is a no-op for an unknown id', async () => {
    const { downloader, FileSystem } = load();
    await downloader.start('nope');
    expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();
  });

  it('records an error state when the download throws', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.createDownloadResumable.mockReturnValueOnce({
      downloadAsync: jest.fn(() => Promise.reject(new Error('network down'))),
    });
    await downloader.start(firstRemote);
    expect(downloader.isDownloaded(firstRemote)).toBe(false);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('getPlayableUri returns a local uri only when the file exists', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 50000 });
    const uri = await downloader.getPlayableUri(firstRemote);
    expect(uri).toContain(`${firstRemote}.mp3`);

    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
    const none = await downloader.getPlayableUri(firstRemote);
    expect(none).toBeNull();
  });

  it('checkInstalled marks an entry downloaded when its file is present', async () => {
    const { downloader, FileSystem } = load();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true, size: 50000 });
    await downloader.checkInstalled();
    expect(downloader.isDownloaded(firstRemote)).toBe(true);
  });

  it('remove deletes the file and resets state', async () => {
    const { downloader, FileSystem } = load();
    await downloader.start(firstRemote);
    expect(downloader.isDownloaded(firstRemote)).toBe(true);
    await downloader.remove(firstRemote);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
    expect(downloader.isDownloaded(firstRemote)).toBe(false);
  });
});
