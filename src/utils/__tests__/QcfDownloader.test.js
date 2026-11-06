import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import fs from 'fs';
import path from 'path';

function mockFontFiles() {
  const bytes = Buffer.alloc(2048);
  bytes.writeUInt32BE(0x00010000, 0);
  bytes.writeUInt16BE(1, 4);
  bytes.write('name', 12);
  bytes.writeUInt32BE(28, 20);
  bytes.writeUInt32BE(bytes.length - 28, 24);
  const files = new Map();
  FileSystem.getInfoAsync.mockImplementation(async uri => ({ exists: files.has(uri), size: files.get(uri)?.length }));
  FileSystem.readAsStringAsync.mockImplementation(async (uri, { position = 0, length } = {}) => {
    const data = files.get(uri);
    return data.subarray(position, length == null ? undefined : position + length).toString('base64');
  });
  FileSystem.deleteAsync.mockImplementation(async uri => { files.delete(uri); });
  FileSystem.moveAsync.mockImplementation(async ({ from, to }) => { files.set(to, files.get(from)); files.delete(from); });
  FileSystem.downloadAsync.mockImplementation(async (url, uri) => { files.set(uri, bytes); return { status: 200 }; });
  return { files, bytes };
}

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
    FileSystem.deleteAsync.mockResolvedValue();
    FileSystem.moveAsync.mockResolvedValue();
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

  it.each([
    ['v1', false, 'p1.ttf'], ['v1', true, 'p1.ttf'],
    ['v2', false, 'p1.ttf'], ['v2', true, 'p1.ttf'],
    ['v4', false, 'p1.ttf'], ['v4', true, 'p1d.ttf'],
  ])('loads the correct %s font with dark=%s', async (version, dark, filename) => {
    const { files, bytes } = mockFontFiles();
    const uri = `${FileSystem.documentDirectory}quran/fonts/${version}/${filename}`;
    files.set(uri, bytes);
    Font.isLoaded.mockReturnValue(false);
    await loadDownloader().loadPageFont(version, 1, dark);
    expect(Object.values(Font.loadAsync.mock.calls[0][0])).toEqual([uri]);
  });

  it('redownloads old truncated fonts and never promotes interrupted partial downloads', async () => {
    const { files, bytes } = mockFontFiles();
    const dest = `${FileSystem.documentDirectory}quran/fonts/v2/p1.ttf`;
    files.set(dest, bytes.subarray(0, 1500));
    const download = FileSystem.downloadAsync.getMockImplementation();
    FileSystem.downloadAsync.mockImplementation(async (url, uri) => {
      if (uri === `${dest}.part`) {
        files.set(uri, bytes.subarray(0, 1500));
        throw new Error('connection lost');
      }
      return download(url, uri);
    });
    const downloader = loadDownloader();
    await expect(downloader.start('v2')).rejects.toThrow('connection lost');
    expect(downloader.isInstalled('v2')).toBe(false);
    expect(files.has(`${dest}.part`)).toBe(false);
    expect(files.get(dest)).toHaveLength(1500);
    FileSystem.downloadAsync.mockImplementation(download);
    await downloader.start('v2');
    expect(files.get(dest)).toHaveLength(2048);
    expect(downloader.isInstalled('v2')).toBe(true);
    expect(FileSystem.moveAsync).toHaveBeenCalledWith({ from: `${dest}.part`, to: dest });
  });

  it('makes an old installed pack repairable when a page font is truncated', async () => {
    const { files, bytes } = mockFontFiles();
    files.set(`${FileSystem.documentDirectory}quran/fonts/v2/p1.ttf`, bytes.subarray(0, 1500));
    Font.isLoaded.mockReturnValue(false);
    const downloader = loadDownloader();
    downloader.state.v2.installed = true;
    await expect(downloader.loadPageFont('v2', 1, false)).rejects.toThrow('Incomplete font');
    expect(downloader.isInstalled('v2')).toBe(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@quran_qcf_v2_installed');
    expect(Font.loadAsync).not.toHaveBeenCalled();
  });

  it('accepts a real bundled OpenType font rather than only the synthetic fixture', async () => {
    const { files } = mockFontFiles();
    const uri = `${FileSystem.documentDirectory}quran/fonts/v2/p1.ttf`;
    files.set(uri, fs.readFileSync(path.join(__dirname, '../../../assets/quran/fonts/UthmanicHafs1Ver18.ttf')));
    Font.isLoaded.mockReturnValue(false);
    await expect(loadDownloader().loadPageFont('v2', 1, true)).resolves.toBe('QCFv2_P001');
  });

  it('allows repairing an incomplete pack even if clearing its installed flag fails', async () => {
    mockFontFiles();
    Font.isLoaded.mockReturnValue(false);
    AsyncStorage.removeItem.mockRejectedValueOnce(new Error('storage unavailable'));
    const downloader = loadDownloader();
    downloader.state.v2.installed = true;
    await expect(downloader.loadPageFont('v2', 1, false)).rejects.toThrow('storage unavailable');
    expect(downloader.isInstalled('v2')).toBe(false);
    await downloader.start('v2');
    expect(downloader.isInstalled('v2')).toBe(true);
  });
});
