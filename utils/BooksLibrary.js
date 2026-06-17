import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import booksCatalog from '../assets/books/data/books.json';
import { BOOKS_CONSTANTS } from '../constants/BooksConstants';
import { bookFileUri } from './BooksDownloader';

const { STORAGE_KEYS } = BOOKS_CONSTANTS;

const contentLoaders = {
  nawawi40: () => require('../assets/books/data/nawawi40.json'),
  qudsi40: () => require('../assets/books/data/qudsi40.json'),
  shahwaliullah40: () => require('../assets/books/data/shahwaliullah40.json'),
  riyad_assalihin: () => require('../assets/books/data/riyad_assalihin.json'),
  aladab_almufrad: () => require('../assets/books/data/aladab_almufrad.json'),
  shamail_muhammadiyah: () => require('../assets/books/data/shamail_muhammadiyah.json'),
};

const bookCache = {};

export function getBooksCatalog() {
  return booksCatalog;
}

export function getBookMeta(id) {
  return booksCatalog.find((b) => b.id === id) || null;
}

export function loadBook(id) {
  if (bookCache[id]) return bookCache[id];
  const meta = getBookMeta(id);
  const loader = contentLoaders[id];
  if (!meta || !loader) return null;
  const content = loader();
  const book = { ...meta, entries: content.entries || [] };
  bookCache[id] = book;
  return book;
}

export async function loadBookAsync(id) {
  if (bookCache[id]) return bookCache[id];
  const meta = getBookMeta(id);
  if (!meta) return null;
  if (meta.bundled) return loadBook(id);
  try {
    const info = await FileSystem.getInfoAsync(bookFileUri(id));
    if (!info.exists) return null;
    const content = JSON.parse(await FileSystem.readAsStringAsync(bookFileUri(id)));
    const book = { ...meta, entries: content.entries || [] };
    bookCache[id] = book;
    return book;
  } catch {
    return null;
  }
}

const TASHKEEL_RE = /[ً-ٰۖ-ۭ۟-ۥؐ-ؚ]/g;
const TATWEEL_RE = /ـ/g;
const NONLETTER_RE = /[^ء-يٱ-ە\s]/g;

export function normalizeArabic(text) {
  let t = (text || '').replace(TASHKEEL_RE, '').replace(TATWEEL_RE, '');
  t = t.replace(/[ٱآأإ]/g, 'ا');
  t = t.replace(/ى/g, 'ي');
  t = t.replace(/ة/g, 'ه');
  t = t.replace(NONLETTER_RE, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

const HAS_ARABIC_RE = /[ء-ي]/;

export function searchBook(id, query) {
  const book = bookCache[id] || loadBook(id);
  if (!book) return [];
  const raw = (query || '').trim();
  if (raw.length < 2) return [];
  if (HAS_ARABIC_RE.test(raw)) {
    const terms = normalizeArabic(raw).split(' ').filter((w) => w.length >= 2);
    if (!terms.length) return [];
    return book.entries.filter((e) => {
      const hay = normalizeArabic(e.textAr);
      return terms.every((term) => hay.includes(term));
    });
  }
  const terms = raw.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  if (!terms.length) return [];
  return book.entries.filter((e) => {
    const hay = (e.textEn || '').toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}

export async function getLastRead(bookId) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ);
    const map = raw ? JSON.parse(raw) : {};
    return map[bookId] || 0;
  } catch {
    return 0;
  }
}

export async function setLastRead(bookId, index) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ);
    const map = raw ? JSON.parse(raw) : {};
    map[bookId] = index;
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(map));
  } catch {}
}

export async function getBookmarks(bookId) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    const map = raw ? JSON.parse(raw) : {};
    return map[bookId] || [];
  } catch {
    return [];
  }
}

export async function setBookmarks(bookId, list) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    const map = raw ? JSON.parse(raw) : {};
    map[bookId] = list;
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(map));
  } catch {}
}
