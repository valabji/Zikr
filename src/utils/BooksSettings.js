import { BOOKS_CONSTANTS } from '@/constants/BooksConstants';
import { createSettingsStore } from './createSettingsStore';

const store = createSettingsStore(BOOKS_CONSTANTS.STORAGE_KEYS.SETTINGS, BOOKS_CONSTANTS.DEFAULT_SETTINGS);

export const loadBooksSettings = store.load;
export const getCachedBooksSettings = store.getCached;
export const setBooksSettings = store.set;
export const subscribeBooksSettings = store.subscribe;
export const _resetForTests = store._resetForTests;
