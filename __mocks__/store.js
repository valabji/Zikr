// __mocks__/store.js
export const mystore = {
  subscribe: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(() => ({
    obj: { Azkar: [] }
  })),
};
