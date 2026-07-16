import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadAzkarOrder, saveAzkarOrder, orderCategories,
  azkarItemKeys, orderAzkarItems, loadAzkarItemOrder, saveAzkarItemOrder,
} from '@/utils/AzkarOrder';

const cat = (name, index) => ({ name, index, fav: false });

describe('orderCategories', () => {
  const cats = [cat('b', 0), cat('a', 5), cat('c', 9)];

  it('keeps natural order in default mode', () => {
    expect(orderCategories(cats, { mode: 'default', manual: [] }).map(c => c.name)).toEqual(['b', 'a', 'c']);
  });

  it('sorts alphabetically', () => {
    expect(orderCategories(cats, { mode: 'alpha', manual: [] }).map(c => c.name)).toEqual(['a', 'b', 'c']);
  });

  it('applies manual order', () => {
    expect(orderCategories(cats, { mode: 'manual', manual: ['c', 'b', 'a'] }).map(c => c.name)).toEqual(['c', 'b', 'a']);
  });

  it('appends categories missing from manual order in natural order', () => {
    expect(orderCategories(cats, { mode: 'manual', manual: ['c'] }).map(c => c.name)).toEqual(['c', 'b', 'a']);
  });

  it('ignores manual entries that no longer exist', () => {
    expect(orderCategories(cats, { mode: 'manual', manual: ['gone', 'a'] }).map(c => c.name)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to natural order when manual list is empty', () => {
    expect(orderCategories(cats, { mode: 'manual', manual: [] }).map(c => c.name)).toEqual(['b', 'a', 'c']);
  });

  it('does not mutate the input array', () => {
    orderCategories(cats, { mode: 'alpha', manual: [] });
    expect(cats.map(c => c.name)).toEqual(['b', 'a', 'c']);
  });
});

describe('loadAzkarOrder', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
  });

  it('returns default when nothing is stored', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    expect(await loadAzkarOrder()).toEqual({ mode: 'default', manual: [] });
  });

  it('returns the stored order', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ mode: 'manual', manual: ['a'] }));
    expect(await loadAzkarOrder()).toEqual({ mode: 'manual', manual: ['a'] });
  });

  it('falls back on corrupt data', async () => {
    AsyncStorage.getItem.mockResolvedValue('{nope');
    expect(await loadAzkarOrder()).toEqual({ mode: 'default', manual: [] });
  });

  it('falls back on unknown mode', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ mode: 'zigzag', manual: ['a'] }));
    expect(await loadAzkarOrder()).toEqual({ mode: 'default', manual: [] });
  });

  it('normalizes a missing manual list', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ mode: 'alpha' }));
    expect(await loadAzkarOrder()).toEqual({ mode: 'alpha', manual: [] });
  });
});

describe('saveAzkarOrder', () => {
  it('persists under @azkar_order', async () => {
    await saveAzkarOrder({ mode: 'manual', manual: ['a', 'b'] });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@azkar_order', JSON.stringify({ mode: 'manual', manual: ['a', 'b'] }));
  });
});

const zekr = (text) => ({ zekr: text, count: 1 });

describe('azkarItemKeys', () => {
  it('uses the zekr text as key', () => {
    expect(azkarItemKeys([zekr('x'), zekr('y')])).toEqual(['x', 'y']);
  });

  it('suffixes repeated texts by occurrence', () => {
    expect(azkarItemKeys([zekr('x'), zekr('y'), zekr('x'), zekr('x')])).toEqual(['x', 'y', 'x#1', 'x#2']);
  });
});

describe('orderAzkarItems', () => {
  const items = [zekr('a'), zekr('b'), zekr('c')];

  it('returns item/key pairs in natural order by default', () => {
    const pairs = orderAzkarItems(items, { mode: 'default', manual: [] });
    expect(pairs.map(p => p.key)).toEqual(['a', 'b', 'c']);
    expect(pairs[0].item).toBe(items[0]);
  });

  it('applies manual order', () => {
    expect(orderAzkarItems(items, { mode: 'manual', manual: ['c', 'a', 'b'] }).map(p => p.key)).toEqual(['c', 'a', 'b']);
  });

  it('appends items missing from manual order and drops stale keys', () => {
    expect(orderAzkarItems(items, { mode: 'manual', manual: ['gone', 'b'] }).map(p => p.key)).toEqual(['b', 'a', 'c']);
  });

  it('keys duplicates by canonical order so moving one is stable', () => {
    const dupes = [zekr('x'), zekr('x'), zekr('y')];
    const pairs = orderAzkarItems(dupes, { mode: 'manual', manual: ['x#1', 'x', 'y'] });
    expect(pairs.map(p => p.key)).toEqual(['x#1', 'x', 'y']);
    expect(pairs[0].item).toBe(dupes[1]);
    expect(pairs[1].item).toBe(dupes[0]);
  });
});

describe('loadAzkarItemOrder', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
  });

  it('returns default when nothing is stored', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    expect(await loadAzkarItemOrder('cat')).toEqual({ mode: 'default', manual: [] });
  });

  it('returns the stored order for the category only', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
      cat: { mode: 'manual', manual: ['a'] },
      other: { mode: 'manual', manual: ['z'] },
    }));
    expect(await loadAzkarItemOrder('cat')).toEqual({ mode: 'manual', manual: ['a'] });
    expect(await loadAzkarItemOrder('unknown')).toEqual({ mode: 'default', manual: [] });
  });

  it('falls back on corrupt data', async () => {
    AsyncStorage.getItem.mockResolvedValue('{nope');
    expect(await loadAzkarItemOrder('cat')).toEqual({ mode: 'default', manual: [] });
  });
});

describe('saveAzkarItemOrder', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
  });

  it('merges into the stored map without clobbering other categories', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ other: { mode: 'manual', manual: ['z'] } }));
    await saveAzkarItemOrder('cat', { mode: 'manual', manual: ['a'] });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@azkar_item_order', JSON.stringify({
      other: { mode: 'manual', manual: ['z'] },
      cat: { mode: 'manual', manual: ['a'] },
    }));
  });

  it('starts a fresh map when stored data is corrupt', async () => {
    AsyncStorage.getItem.mockResolvedValue('{nope');
    await saveAzkarItemOrder('cat', { mode: 'default', manual: [] });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@azkar_item_order', JSON.stringify({
      cat: { mode: 'default', manual: [] },
    }));
  });
});
