import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProgressStore } from '@/utils/createProgressStore';

let store;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue('{"count":10}');
  AsyncStorage.setItem.mockResolvedValue();
  store = createProgressStore('progress', () => ({ count: 0 }), value => value);
});
afterEach(() => { store.reset(); jest.useRealTimers(); });

it('automatically hydrates and replays multiple actions in order', async () => {
  store.update(s => ({ count: s.count + 1 }));
  store.update(s => ({ count: s.count * 2 }));
  expect(store.getCached()).toEqual({ count: 2 });
  expect(await store.load()).toEqual({ count: 22 });
});

it('serializes persistence and continues after a failed write', async () => {
  await store.load();
  let rejectFirst;
  AsyncStorage.setItem.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectFirst = reject; }));
  store.update(s => ({ count: s.count + 1 }));
  jest.advanceTimersByTime(500);
  store.update(s => ({ count: s.count + 1 }));
  jest.advanceTimersByTime(500);
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  rejectFirst(new Error('write failed'));
  await jest.advanceTimersByTimeAsync(0);
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('progress', '{"count":12}');
});
