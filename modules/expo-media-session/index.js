import { requireOptionalNativeModule } from 'expo-modules-core';

const native = requireOptionalNativeModule('ExpoMediaSession');

export function isAvailable() {
  return !!native;
}

export function updateMetadata(metadata) {
  if (native) native.updateMetadata(metadata);
}

export function clear() {
  if (native) native.clear();
}

export function addCommandListener(listener) {
  if (!native) return { remove() {} };
  return native.addListener('onCommand', listener);
}
