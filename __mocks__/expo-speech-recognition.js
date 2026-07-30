const listeners = {};

export const ExpoSpeechRecognitionModule = {
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted' }),
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  supportsOnDeviceRecognition: jest.fn(() => true),
  isRecognitionAvailable: jest.fn(() => true),
  addListener: jest.fn((name, cb) => {
    (listeners[name] = listeners[name] || new Set()).add(cb);
    return { remove: () => listeners[name] && listeners[name].delete(cb) };
  }),
  __emit: (name, payload) => {
    (listeners[name] || new Set()).forEach((cb) => cb(payload));
  },
  __reset: () => {
    Object.keys(listeners).forEach((k) => listeners[k].clear());
  },
};

export const useSpeechRecognitionEvent = jest.fn();
