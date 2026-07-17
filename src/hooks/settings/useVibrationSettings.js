import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import vibrationManager, { VIBRATION_TYPES, VIBRATION_INTENSITY } from '@/utils/Vibration';
import { useAudio } from '@/utils/audio/Sounds';

export function useVibrationSettings(autoSave) {
  const { playClick } = useAudio();
  const [tempTasbihVibration, setTempTasbihVibration] = useState(false);
  const [tempAzkarVibration, setTempAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [tempVibrationIntensity, setTempVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [tasbihVibration, setTasbihVibration] = useState(false);
  const [azkarVibration, setAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [vibrationIntensity, setVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [lastSavedTasbihVibration, setLastSavedTasbihVibration] = useState(false);
  const [lastSavedAzkarVibration, setLastSavedAzkarVibration] = useState(VIBRATION_TYPES.OFF);
  const [lastSavedVibrationIntensity, setLastSavedVibrationIntensity] = useState(VIBRATION_INTENSITY.LIGHT);

  useEffect(() => {
    const load = async () => {
      try {
        await vibrationManager.initialize();
        const currentTasbih = vibrationManager.getTasbihSetting();
        const currentAzkar = vibrationManager.getAzkarSetting();
        const currentIntensity = vibrationManager.getIntensity();
        setTasbihVibration(currentTasbih);
        setTempTasbihVibration(currentTasbih);
        setLastSavedTasbihVibration(currentTasbih);
        setAzkarVibration(currentAzkar);
        setTempAzkarVibration(currentAzkar);
        setLastSavedAzkarVibration(currentAzkar);
        setVibrationIntensity(currentIntensity);
        setTempVibrationIntensity(currentIntensity);
        setLastSavedVibrationIntensity(currentIntensity);
        setVibrationSupported(await vibrationManager.isVibrationSupported());
      } catch (error) {
        console.warn('Failed to load vibration settings:', error);
      }
    };
    load();
  }, []);

  const handleTasbihVibrationChange = (setting) => {
    playClick();
    setTempTasbihVibration(setting);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setTasbihVibration(setting);
        setTasbihVibration(setting);
        setLastSavedTasbihVibration(setting);
      }, 100);
    }
  };

  const handleAzkarVibrationChange = (setting) => {
    playClick();
    setTempAzkarVibration(setting);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setAzkarVibration(setting);
        setAzkarVibration(setting);
        setLastSavedAzkarVibration(setting);
      }, 100);
    }
  };

  const handleIntensityChange = (intensity) => {
    playClick();
    vibrationManager.performVibration(intensity);
    setTempVibrationIntensity(intensity);
    if (autoSave) {
      setTimeout(async () => {
        await vibrationManager.setVibrationIntensity(intensity);
        setVibrationIntensity(intensity);
        setLastSavedVibrationIntensity(intensity);
      }, 100);
    }
  };

  const applyVibration = async () => {
    if (tempTasbihVibration !== tasbihVibration) {
      await vibrationManager.setTasbihVibration(tempTasbihVibration);
      setTasbihVibration(tempTasbihVibration);
      setLastSavedTasbihVibration(tempTasbihVibration);
    }
    if (tempAzkarVibration !== azkarVibration) {
      await vibrationManager.setAzkarVibration(tempAzkarVibration);
      setAzkarVibration(tempAzkarVibration);
      setLastSavedAzkarVibration(tempAzkarVibration);
    }
    if (tempVibrationIntensity !== vibrationIntensity) {
      await vibrationManager.setVibrationIntensity(tempVibrationIntensity);
      setVibrationIntensity(tempVibrationIntensity);
      setLastSavedVibrationIntensity(tempVibrationIntensity);
    }
  };

  const resetVibration = async () => {
    setTempTasbihVibration(false);
    setTempAzkarVibration(VIBRATION_TYPES.OFF);
    setTempVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
    if (autoSave) {
      await vibrationManager.setTasbihVibration(false);
      setTasbihVibration(false);
      setLastSavedTasbihVibration(false);
      await vibrationManager.setAzkarVibration(VIBRATION_TYPES.OFF);
      setAzkarVibration(VIBRATION_TYPES.OFF);
      setLastSavedAzkarVibration(VIBRATION_TYPES.OFF);
      await vibrationManager.setVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
      setVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
      setLastSavedVibrationIntensity(VIBRATION_INTENSITY.LIGHT);
    }
  };

  const hasUnsavedVibration = useCallback(() => {
    if (tempTasbihVibration !== lastSavedTasbihVibration) return true;
    if (tempAzkarVibration !== lastSavedAzkarVibration) return true;
    if (tempVibrationIntensity !== lastSavedVibrationIntensity) return true;
    return false;
  }, [tempTasbihVibration, lastSavedTasbihVibration, tempAzkarVibration, lastSavedAzkarVibration, tempVibrationIntensity, lastSavedVibrationIntensity]);

  const showVibration = vibrationSupported && Platform.OS !== 'web';

  return {
    showVibration,
    tempTasbihVibration,
    tempAzkarVibration,
    tempVibrationIntensity,
    handleTasbihVibrationChange,
    handleAzkarVibrationChange,
    handleIntensityChange,
    applyVibration,
    resetVibration,
    hasUnsavedVibration,
  };
}
