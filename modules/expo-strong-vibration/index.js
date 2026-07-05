import { requireOptionalNativeModule } from 'expo-modules-core';

const native = requireOptionalNativeModule('ExpoStrongVibration');

export function isAvailable() {
  return !!native;
}

export function vibrate(durationMs) {
  if (native) native.vibrate(durationMs);
}

export function vibratePattern(pattern) {
  if (native) native.vibratePattern(pattern);
}

export function hasVibrator() {
  return native ? native.hasVibrator() : true;
}
