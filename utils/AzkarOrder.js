import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@azkar_order';
const ITEM_STORAGE_KEY = '@azkar_item_order';
const MODES = ['default', 'alpha', 'manual'];

export async function loadAzkarOrder() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && MODES.includes(parsed.mode)) {
      return { mode: parsed.mode, manual: Array.isArray(parsed.manual) ? parsed.manual : [] };
    }
  } catch (e) { }
  return { mode: 'default', manual: [] };
}

export async function saveAzkarOrder(order) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch (e) { }
}

export function orderCategories(categories, { mode, manual }) {
  if (mode === 'alpha') {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }
  if (mode === 'manual' && manual.length) {
    const rank = new Map(manual.map((name, i) => [name, i]));
    const ranked = categories.filter(c => rank.has(c.name)).sort((a, b) => rank.get(a.name) - rank.get(b.name));
    const unranked = categories.filter(c => !rank.has(c.name));
    return [...ranked, ...unranked];
  }
  return categories;
}

export function azkarItemKeys(items) {
  const seen = new Map();
  return items.map(item => {
    const n = seen.get(item.zekr) || 0;
    seen.set(item.zekr, n + 1);
    return n === 0 ? item.zekr : item.zekr + '#' + n;
  });
}

export function orderAzkarItems(items, { mode, manual }) {
  const keys = azkarItemKeys(items);
  const pairs = items.map((item, i) => ({ item, key: keys[i] }));
  if (mode !== 'manual' || !manual.length) return pairs;
  const rank = new Map(manual.map((key, i) => [key, i]));
  const ranked = pairs.filter(p => rank.has(p.key)).sort((a, b) => rank.get(a.key) - rank.get(b.key));
  const unranked = pairs.filter(p => !rank.has(p.key));
  return [...ranked, ...unranked];
}

export async function loadAzkarItemOrder(category) {
  try {
    const raw = await AsyncStorage.getItem(ITEM_STORAGE_KEY);
    const entry = raw ? JSON.parse(raw)[category] : null;
    if (entry && MODES.includes(entry.mode)) {
      return { mode: entry.mode, manual: Array.isArray(entry.manual) ? entry.manual : [] };
    }
  } catch (e) { }
  return { mode: 'default', manual: [] };
}

export async function saveAzkarItemOrder(category, order) {
  try {
    let map = {};
    try {
      const raw = await AsyncStorage.getItem(ITEM_STORAGE_KEY);
      map = raw ? JSON.parse(raw) : {};
    } catch (e) { }
    map[category] = order;
    await AsyncStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(map));
  } catch (e) { }
}
