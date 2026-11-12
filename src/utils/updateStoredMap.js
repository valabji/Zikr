import AsyncStorage from '@react-native-async-storage/async-storage';

const pending = new Map();

// Serialize the whole read/modify/write cycle, not just the final write.
export function updateStoredMap(key, update) {
  const previous = pending.get(key) || Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    const raw = await AsyncStorage.getItem(key);
    let parsed;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const map = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    const next = update(map);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  pending.set(key, operation);
  const cleanup = () => { if (pending.get(key) === operation) pending.delete(key); };
  operation.then(cleanup, cleanup);
  return operation;
}
