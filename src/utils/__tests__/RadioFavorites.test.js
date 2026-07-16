import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadRadioFavorites, getCachedRadioFavorites, isRadioFavorite,
  toggleRadioFavorite, subscribeRadioFavorites, _resetForTests,
} from '@/utils/RadioFavorites';
import { RADIO_CONSTANTS } from '@/constants/RadioConstants';

const { STORAGE_KEYS } = RADIO_CONSTANTS;

describe('RadioFavorites', () => {
  let store;
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTests();
    store = {};
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(store[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => { store[k] = v; return Promise.resolve(); });
  });

  it('loads an empty list when nothing is stored', async () => {
    const favs = await loadRadioFavorites();
    expect(favs).toEqual([]);
  });

  it('parses a stored array and caches it', async () => {
    store[STORAGE_KEYS.FAVORITES] = JSON.stringify([3, 7]);
    const favs = await loadRadioFavorites();
    expect(favs).toEqual([3, 7]);
    expect(getCachedRadioFavorites()).toEqual([3, 7]);
    expect(isRadioFavorite(3)).toBe(true);
    expect(isRadioFavorite(9)).toBe(false);
  });

  it('recovers from corrupt json', async () => {
    store[STORAGE_KEYS.FAVORITES] = '{not json';
    const favs = await loadRadioFavorites();
    expect(favs).toEqual([]);
  });

  it('toggles a favorite on and off and persists', async () => {
    await loadRadioFavorites();
    let favs = await toggleRadioFavorite(5);
    expect(favs).toEqual([5]);
    expect(JSON.parse(store[STORAGE_KEYS.FAVORITES])).toEqual([5]);
    favs = await toggleRadioFavorite(5);
    expect(favs).toEqual([]);
    expect(JSON.parse(store[STORAGE_KEYS.FAVORITES])).toEqual([]);
  });

  it('notifies subscribers on change and stops after unsubscribe', async () => {
    const seen = [];
    const unsub = subscribeRadioFavorites((f) => seen.push([...f]));
    await toggleRadioFavorite(1);
    await toggleRadioFavorite(2);
    unsub();
    await toggleRadioFavorite(3);
    expect(seen).toEqual([[1], [1, 2]]);
  });
});
