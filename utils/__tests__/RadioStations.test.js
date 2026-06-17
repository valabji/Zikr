import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBundledStations, fetchStations, getStations, isCacheFresh, getStationSubtitle,
} from '../RadioStations';
import { RADIO_CONSTANTS } from '../../constants/RadioConstants';

const { STORAGE_KEYS, CACHE_TTL_MS } = RADIO_CONSTANTS;

const apiPayload = (lang) => ({
  radios: [
    { id: 1, name: lang === 'ar' ? ' إذاعة أولى ' : ' Radio One ', url: 'https://stream.example/one' },
    { id: 2, name: lang === 'ar' ? 'إذاعة ثانية' : 'Radio Two', url: 'https://stream.example/two' },
    { id: 99, name: 'no url dropped', url: '' },
  ],
});

describe('RadioStations', () => {
  let store;
  beforeEach(() => {
    jest.clearAllMocks();
    store = {};
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(store[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => { store[k] = v; return Promise.resolve(); });
    global.fetch = jest.fn();
  });

  it('getBundledStations returns localized names and stream urls', () => {
    const ar = getBundledStations('ar');
    const en = getBundledStations('en');
    expect(ar.length).toBeGreaterThanOrEqual(15);
    expect(ar.length).toBe(en.length);
    expect(ar[0].name).not.toBe(en[0].name);
    ar.forEach((s) => expect(s.streamUrl).toMatch(/^https?:\/\//));
  });

  it('fetchStations maps the API shape, drops urlless rows, and caches', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(apiPayload('en')) });
    const stations = await fetchStations('en', { now: 1000 });
    expect(stations).toEqual([
      { id: 1, name: 'Radio One', streamUrl: 'https://stream.example/one' },
      { id: 2, name: 'Radio Two', streamUrl: 'https://stream.example/two' },
    ]);
    const cached = JSON.parse(store[STORAGE_KEYS.CACHE]);
    expect(cached.eng.stations).toHaveLength(2);
    expect(cached.eng.timestamp).toBe(1000);
  });

  it('maps ar language to the eng-free api key and trims arabic names', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(apiPayload('ar')) });
    const stations = await fetchStations('ar', { now: 5 });
    expect(stations[0].name).toBe('إذاعة أولى');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('language=ar'));
    expect(JSON.parse(store[STORAGE_KEYS.CACHE]).ar.stations).toHaveLength(2);
  });

  it('falls back to cache when the network fails', async () => {
    store[STORAGE_KEYS.CACHE] = JSON.stringify({
      eng: { stations: [{ id: 7, name: 'Cached', streamUrl: 'https://c/7' }], timestamp: 1 },
    });
    global.fetch.mockRejectedValue(new Error('offline'));
    const stations = await fetchStations('en', { now: 2 });
    expect(stations).toEqual([{ id: 7, name: 'Cached', streamUrl: 'https://c/7' }]);
  });

  it('falls back to bundled list when network fails and no cache exists', async () => {
    global.fetch.mockRejectedValue(new Error('offline'));
    const stations = await fetchStations('en', { now: 2 });
    expect(stations).toEqual(getBundledStations('en'));
    expect(stations.length).toBeGreaterThanOrEqual(15);
  });

  it('falls back when the api returns a non-ok status', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) });
    const stations = await fetchStations('en', { now: 2 });
    expect(stations).toEqual(getBundledStations('en'));
  });

  it('getStations serves fresh cache without hitting the network', async () => {
    store[STORAGE_KEYS.CACHE] = JSON.stringify({
      eng: { stations: [{ id: 7, name: 'Fresh', streamUrl: 'https://c/7' }], timestamp: 1000 },
    });
    const stations = await getStations('en', { now: 1000 + CACHE_TTL_MS - 1 });
    expect(stations).toEqual([{ id: 7, name: 'Fresh', streamUrl: 'https://c/7' }]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('getStations refetches when the cache is stale', async () => {
    store[STORAGE_KEYS.CACHE] = JSON.stringify({
      eng: { stations: [{ id: 7, name: 'Stale', streamUrl: 'https://c/7' }], timestamp: 1 },
    });
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(apiPayload('en')) });
    const stations = await getStations('en', { now: 1 + CACHE_TTL_MS + 1 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(stations.map((s) => s.id)).toEqual([1, 2]);
  });

  it('labels riwaya narrations and recitation styles as natural statements', () => {
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh', 'en')).toBe('Warsh narration');
    expect(getStationSubtitle('https://backup.qurango.net/radio/ali_alhuthaifi_qalon', 'en')).toBe('Qalon narration');
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad', 'en')).toBe('Mujawwad recitation');
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh', 'ar')).toBe('رواية ورش');
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad', 'ar')).toBe('تلاوة مجوّدة');
  });

  it('getStationSubtitle returns empty for plain reciter slugs and matches only whole tokens', () => {
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulbasit_abdulsamad', 'en')).toBe('');
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdullah_alkhalaf', 'en')).toBe('');
    expect(getStationSubtitle('https://backup.qurango.net/radio/abdulrasheed_soufi_khalaf', 'en')).toBe('Khalaf narration');
    expect(getStationSubtitle('', 'en')).toBe('');
    expect(getStationSubtitle('https://backup.qurango.net/radio/ahmad_alajmy/', 'en')).toBe('');
  });

  it('isCacheFresh respects the TTL window', () => {
    expect(isCacheFresh({ timestamp: 100 }, 100)).toBe(true);
    expect(isCacheFresh({ timestamp: 100 }, 100 + CACHE_TTL_MS - 1)).toBe(true);
    expect(isCacheFresh({ timestamp: 100 }, 100 + CACHE_TTL_MS)).toBe(false);
    expect(isCacheFresh(null, 100)).toBe(false);
  });
});
