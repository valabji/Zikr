import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BooksDownloader, { bookFileUri } from '@/utils/books/BooksDownloader';
import { BOOKS_CONSTANTS } from '@/constants/BooksConstants';

const VERSION_TAG = String(BOOKS_CONSTANTS.DATA_VERSION);

const RAW_BOOK = JSON.stringify({
  hadiths: [
    { idInBook: 1, arabic: 'حديث أول', english: { narrator: 'N:', text: 'first' } },
    { idInBook: 2, arabic: 'حديث ثان' },
  ],
});

describe('BooksDownloader', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = {};
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(store[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => { store[k] = v; return Promise.resolve(); });
    AsyncStorage.removeItem.mockImplementation((k) => { delete store[k]; return Promise.resolve(); });
    FileSystem.readAsStringAsync.mockResolvedValue(RAW_BOOK);
    FileSystem.createDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn(() => Promise.resolve({ uri: '/mock/file' })),
      cancelAsync: jest.fn(() => Promise.resolve()),
    });
  });

  it('bookFileUri builds a path under the document directory', () => {
    expect(bookFileUri('bukhari')).toContain('books/bukhari.json');
  });

  it('downloads, transforms, writes and flags installed', async () => {
    await BooksDownloader.start({ id: 'bukhari', src: 'the_9_books/bukhari.json' });
    expect(FileSystem.createDownloadResumable).toHaveBeenCalled();
    const written = FileSystem.writeAsStringAsync.mock.calls.find((c) => c[0] === bookFileUri('bukhari'));
    expect(written).toBeTruthy();
    const payload = JSON.parse(written[1]);
    expect(payload.id).toBe('bukhari');
    expect(payload.entries).toHaveLength(2);
    expect(store['@books_installed_bukhari']).toBe(VERSION_TAG);
    expect(BooksDownloader.isInstalled('bukhari')).toBe(true);
  });

  it('records an error when the source has no usable entries', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('{"hadiths":[]}');
    let latest;
    const unsub = BooksDownloader.subscribe((s) => { latest = s; });
    await BooksDownloader.start({ id: 'muslim', src: 'the_9_books/muslim.json' });
    unsub();
    expect(latest.muslim.installed).toBe(false);
    expect(latest.muslim.error).toBeTruthy();
    expect(store['@books_installed_muslim']).toBeUndefined();
  });

  it('skips web and missing-src books', async () => {
    await BooksDownloader.start(null);
    await BooksDownloader.start({ id: 'nosrc' });
    expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();
  });

  it('startAll downloads every pending book and skips installed ones', async () => {
    store['@books_installed_tirmidhi'] = VERSION_TAG;
    await BooksDownloader.checkInstalled(['tirmidhi']);
    await BooksDownloader.startAll([
      { id: 'tirmidhi', src: 'the_9_books/tirmidhi.json' },
      { id: 'nasai', src: 'the_9_books/nasai.json' },
      { id: 'nosrc' },
    ]);
    expect(store['@books_installed_nasai']).toBe(VERSION_TAG);
    expect(BooksDownloader.isInstalled('nasai')).toBe(true);
    const wroteTirmidhi = FileSystem.writeAsStringAsync.mock.calls.some((c) => c[0] === bookFileUri('tirmidhi'));
    expect(wroteTirmidhi).toBe(false);
  });

  it('checkInstalled reads persisted flags', async () => {
    store['@books_installed_malik'] = VERSION_TAG;
    await BooksDownloader.checkInstalled(['malik', 'ahmed']);
    expect(BooksDownloader.isInstalled('malik')).toBe(true);
    expect(BooksDownloader.isInstalled('ahmed')).toBe(false);
  });

  it('treats an outdated format flag as stale and re-downloads', async () => {
    store['@books_installed_abudawud'] = '1';
    await BooksDownloader.checkInstalled(['abudawud']);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(bookFileUri('abudawud'), { idempotent: true });
    expect(store['@books_installed_abudawud']).toBeUndefined();
    expect(BooksDownloader.isInstalled('abudawud')).toBe(false);
  });

  it('uninstall removes the file and clears the flag', async () => {
    store['@books_installed_darimi'] = VERSION_TAG;
    await BooksDownloader.checkInstalled(['darimi']);
    await BooksDownloader.uninstall('darimi');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(bookFileUri('darimi'), { idempotent: true });
    expect(store['@books_installed_darimi']).toBeUndefined();
    expect(BooksDownloader.isInstalled('darimi')).toBe(false);
  });
});
