module.exports = {
  isAvailable: () => false,
  updateMetadata: jest.fn(),
  clear: jest.fn(),
  addCommandListener: jest.fn(() => ({ remove() {} })),
};
