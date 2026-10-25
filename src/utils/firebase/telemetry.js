import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { setCrashCollection } from './crashlytics';
import { APP_KEYS } from '@/constants/StorageKeys';

let enabled = true;
const DEFAULT_CATEGORIES = { screens: true, events: true, device: true };
let categories = { ...DEFAULT_CATEGORIES };

export function isTelemetryEnabled() {
    return enabled;
}

export function isCategoryEnabled(category) {
    return enabled && categories[category] !== false;
}

export function getTelemetryCategories() {
    return { ...categories };
}

export async function loadTelemetryPreference() {
    enabled = (await AsyncStorage.getItem(APP_KEYS.TELEMETRY_ENABLED)) !== 'false';
    const stored = await AsyncStorage.getItem(APP_KEYS.TELEMETRY_CATEGORIES);
    let parsed;
    try { parsed = stored ? JSON.parse(stored) : null; } catch {}
    categories = Object.fromEntries(Object.entries(DEFAULT_CATEGORIES).map(([key, fallback]) => [
        key, typeof parsed?.[key] === 'boolean' ? parsed[key] : fallback,
    ]));
    await applyCollectionState();
}

export async function setTelemetryEnabled(next) {
    enabled = next;
    await AsyncStorage.setItem(APP_KEYS.TELEMETRY_ENABLED, String(next));
    await applyCollectionState();
}

export async function setTelemetryCategory(category, next) {
    categories = { ...categories, [category]: next };
    await AsyncStorage.setItem(APP_KEYS.TELEMETRY_CATEGORIES, JSON.stringify(categories));
    await applyCollectionState();
}

async function applyCollectionState() {
    const collecting = enabled && (categories.screens || categories.events);
    try {
        await setAnalyticsCollectionEnabled(getAnalytics(), collecting);
    } catch (error) {
        console.warn('Failed to toggle analytics collection:', error);
    }
    await setCrashCollection(enabled);
}
