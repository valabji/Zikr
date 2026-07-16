import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Vibration as RNVibration } from 'react-native';
import * as StrongVibration from '@modules/expo-strong-vibration';

// Vibration types
export const VIBRATION_TYPES = {
  OFF: 'off',
  ON_NEXT: 'on_next', // Only when moving to next zikr
  ON_EVERY: 'on_every' // On every zikr count
};

// Vibration intensity levels
export const VIBRATION_INTENSITY = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy'
};

// Android prefers the local StrongVibration module (max amplitude, notification usage) — RN Vibration's USAGE_UNKNOWN one-shots get muted by OEM touch-feedback sliders.
const ANDROID_DURATIONS = {
  light: 40,
  medium: 70,
  heavy: 100
};

const androidVibrate = (durationMs) => {
  if (StrongVibration.isAvailable()) StrongVibration.vibrate(durationMs);
  else RNVibration.vibrate(durationMs);
};

const androidVibratePattern = (pattern) => {
  if (StrongVibration.isAvailable()) StrongVibration.vibratePattern(pattern);
  else RNVibration.vibrate(pattern);
};

class VibrationManager {
  constructor() {
    this.tasbihEnabled = false;
    this.azkarSetting = VIBRATION_TYPES.OFF;
    this.intensity = VIBRATION_INTENSITY.LIGHT;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const [tasbihEnabled, azkarSetting, intensity] = await Promise.all([
        AsyncStorage.getItem('@vibrationTasbih'),
        AsyncStorage.getItem('@vibrationAzkar'),
        AsyncStorage.getItem('@vibrationIntensity')
      ]);
      
      this.tasbihEnabled = tasbihEnabled === 'true';
      this.azkarSetting = azkarSetting || VIBRATION_TYPES.OFF;
      this.intensity = intensity || VIBRATION_INTENSITY.LIGHT;
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to load vibration settings:', error);
      this.isInitialized = true;
    }
  }

  async setTasbihVibration(enabled) {
    this.tasbihEnabled = enabled;
    try {
      await AsyncStorage.setItem('@vibrationTasbih', enabled.toString());
    } catch (error) {
      console.warn('Failed to save tasbih vibration setting:', error);
    }
  }

  async setAzkarVibration(setting) {
    this.azkarSetting = setting;
    try {
      await AsyncStorage.setItem('@vibrationAzkar', setting);
    } catch (error) {
      console.warn('Failed to save azkar vibration setting:', error);
    }
  }

  async setVibrationIntensity(intensity) {
    this.intensity = intensity;
    try {
      await AsyncStorage.setItem('@vibrationIntensity', intensity);
    } catch (error) {
      console.warn('Failed to save vibration intensity setting:', error);
    }
  }

  getTasbihSetting() {
    return this.tasbihEnabled;
  }

  getAzkarSetting() {
    return this.azkarSetting;
  }

  getIntensity() {
    return this.intensity;
  }

  // Vibrate for tasbih counter
  vibrateForTasbih() {
    if (!this.isInitialized) {
      console.warn('VibrationManager not initialized');
      return;
    }

    if (this.tasbihEnabled) {
      this.performVibration(this.intensity);
    }
  }

  vibrateForTasbihComplete() {
    if (!this.isInitialized) return;
    if (this.tasbihEnabled) {
      if (Platform.OS === 'web') return;
      if (Platform.OS === 'android') {
        androidVibratePattern([0, 30, 40, 30]);
        return;
      }
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (error) { console.warn('Vibration failed:', error); }
    }
  }

  // Vibrate for azkar count
  vibrateForAzkarCount() {
    if (!this.isInitialized) {
      console.warn('VibrationManager not initialized');
      return;
    }

    if (this.azkarSetting === VIBRATION_TYPES.ON_EVERY) {
      this.performVibration(this.intensity);
    }
  }

  // Vibrate when moving to next zikr
  vibrateForNextZikr() {
    if (!this.isInitialized) {
      console.warn('VibrationManager not initialized');
      return;
    }

    if (this.azkarSetting === VIBRATION_TYPES.ON_NEXT || this.azkarSetting === VIBRATION_TYPES.ON_EVERY) {
      this.performVibration(this.intensity);
    }
  }

  // Check if vibration is supported
  async isVibrationSupported() {
    if (Platform.OS === 'web') return false;
    if (Platform.OS === 'android' && StrongVibration.isAvailable()) return StrongVibration.hasVibrator();
    return true;
  }

  // Perform the actual vibration
  performVibration(intensity = 'light') {
    // Skip vibration on web
    if (Platform.OS === 'web') {
      return;
    }

    if (Platform.OS === 'android') {
      androidVibrate(ANDROID_DURATIONS[intensity] ?? ANDROID_DURATIONS.light);
      return;
    }

    try {
      switch (intensity) {
        case VIBRATION_INTENSITY.LIGHT:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case VIBRATION_INTENSITY.MEDIUM:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case VIBRATION_INTENSITY.HEAVY:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }
}

// Create a singleton instance
const vibrationManager = new VibrationManager();

// Initialize the manager when the module is imported
vibrationManager.initialize();

export default vibrationManager;
