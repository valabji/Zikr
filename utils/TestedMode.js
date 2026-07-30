import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tested_mode';

let cached = false;
let loaded = false;
const listeners = new Set();

export async function loadTestedMode() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    cached = value === 'true';
  } catch {
    cached = false;
  }
  loaded = true;
  return cached;
}

export function getTestedMode() {
  return cached;
}

export async function setTestedMode(enabled) {
  cached = !!enabled;
  loaded = true;
  await AsyncStorage.setItem(STORAGE_KEY, cached ? 'true' : 'false');
  listeners.forEach((listener) => listener(cached));
}

export function useTestedMode() {
  const [enabled, setEnabled] = useState(cached);
  useEffect(() => {
    let mounted = true;
    if (!loaded) {
      loadTestedMode().then((value) => { if (mounted) setEnabled(value); });
    } else {
      setEnabled(cached);
    }
    const listener = (value) => { if (mounted) setEnabled(value); };
    listeners.add(listener);
    return () => { mounted = false; listeners.delete(listener); };
  }, []);
  return enabled;
}
