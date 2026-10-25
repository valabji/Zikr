import { requireOptionalNativeModule } from 'expo-modules-core';

const native = requireOptionalNativeModule('ExpoMediaSession');

export function isAvailable() {
  return !!native;
}

export async function updateMetadata(metadata) {
  try { if (native) await native.updateMetadata(metadata); }
  catch (error) { console.warn('Media session metadata update failed:', error); }
}

export async function clear() {
  try { if (native) await native.clear(); }
  catch (error) { console.warn('Media session clear failed:', error); }
}

export function addCommandListener(listener) {
  if (!native) return { remove() {} };
  return native.addListener('onCommand', listener);
}
