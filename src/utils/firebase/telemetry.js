import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { APP_KEYS } from '@/constants/StorageKeys';

let enabled = true;
let categories = { screens: true, events: true, device: true };

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
    if (stored) {
        categories = { ...categories, ...JSON.parse(stored) };
    }
    applyCollectionState();
}

export async function setTelemetryEnabled(next) {
    enabled = next;
    await AsyncStorage.setItem(APP_KEYS.TELEMETRY_ENABLED, String(next));
    applyCollectionState();
}

export async function setTelemetryCategory(category, next) {
    categories = { ...categories, [category]: next };
    await AsyncStorage.setItem(APP_KEYS.TELEMETRY_CATEGORIES, JSON.stringify(categories));
    applyCollectionState();
}

function applyCollectionState() {
    const collecting = enabled && (categories.screens || categories.events);
    try {
        setAnalyticsCollectionEnabled(getAnalytics(), collecting);
    } catch (error) {
        console.warn('Failed to toggle analytics collection:', error);
    }
}
