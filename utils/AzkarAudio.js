import * as Speech from 'expo-speech';
import { useState, useEffect } from 'react';

class AzkarAudioService {
  constructor() {
    this.activeKey = null;
    this.isPlaying = false;
    this._listeners = new Set();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn(this._state());
    return () => this._listeners.delete(fn);
  }

  _state() {
    return { activeKey: this.activeKey, isPlaying: this.isPlaying };
  }

  _emit() {
    const state = this._state();
    this._listeners.forEach((fn) => { try { fn(state); } catch {} });
  }

  speak(key, text) {
    if (!text) return;
    Speech.stop();
    this.activeKey = key;
    this.isPlaying = true;
    this._emit();
    Speech.speak(text, {
      language: 'ar',
      onDone: () => this._onFinished(key),
      onStopped: () => this._onFinished(key),
      onError: () => this._onFinished(key),
    });
  }

  _onFinished(key) {
    if (this.activeKey !== key) return;
    this.activeKey = null;
    this.isPlaying = false;
    this._emit();
  }

  toggle(key, text) {
    if (this.activeKey === key && this.isPlaying) {
      this.stop();
    } else {
      this.speak(key, text);
    }
  }

  stop() {
    Speech.stop();
    this.activeKey = null;
    this.isPlaying = false;
    this._emit();
  }
}

const instance = new AzkarAudioService();

export function useAzkarAudio() {
  const [state, setState] = useState(() => instance._state());
  useEffect(() => instance.subscribe(setState), []);
  return {
    activeKey: state.activeKey,
    isPlaying: state.isPlaying,
    toggle: (key, text) => instance.toggle(key, text),
    stop: () => instance.stop(),
  };
}

export default instance;
