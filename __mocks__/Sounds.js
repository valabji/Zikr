// __mocks__/Sounds.js
export const useAudio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
}));
