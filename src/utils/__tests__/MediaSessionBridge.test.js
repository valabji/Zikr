const mockNative = { updateMetadata: jest.fn(), clear: jest.fn() };
jest.mock('expo-modules-core', () => ({ requireOptionalNativeModule: () => mockNative }));
const bridge = require('../../../modules/expo-media-session/index.js');

it('handles mockNative metadata and clear rejections without leaking rejected promises', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockNative.updateMetadata.mockRejectedValue(new Error('session unavailable'));
  mockNative.clear.mockRejectedValue(new Error('session unavailable'));
  await expect(bridge.updateMetadata({ title: 'Audio' })).resolves.toBeUndefined();
  await expect(bridge.clear()).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalledTimes(2);
  warn.mockRestore();
});
