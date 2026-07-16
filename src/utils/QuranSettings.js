import { QURAN_CONSTANTS } from '@/constants/QuranConstants';
import { createSettingsStore } from './createSettingsStore';

const store = createSettingsStore(QURAN_CONSTANTS.STORAGE_KEYS.SETTINGS, QURAN_CONSTANTS.DEFAULT_SETTINGS);

export const loadQuranSettings = store.load;
export const getCachedQuranSettings = store.getCached;
export const setQuranSettings = store.set;
export const subscribeQuranSettings = store.subscribe;
