import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../locales/i18n', () => ({
  t: (key) => key,
}));

const loadStore = async () => {
  let mod;
  await jest.isolateModulesAsync(async () => {
    mod = require('../TasbihStore');
  });
  await new Promise((r) => setImmediate(r));
  return mod;
};

const loadAndReset = async () => {
  const mod = await loadStore();
  mod._resetForTests();
  return mod;
};

describe('TasbihStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(undefined);
  });

  it('seeds 6 default counters when storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValue(undefined);
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    expect(state.counters).toHaveLength(6);
    expect(state.activeId).toBe(state.counters[0].id);
    state.counters.forEach((c) => {
      expect(typeof c.id).toBe('string');
      expect(c.count).toBe(0);
      expect(c.rounds).toBe(0);
      expect(c.total).toBe(0);
    });
    expect(state.counters[1].nameKey).toBe('counter.presets.subhanAllah');
    expect(state.counters[1].target).toBe(33);
  });

  it('loads and normalizes existing stored JSON', async () => {
    const stored = {
      counters: [
        { id: 'x', nameKey: null, name: 'Mine' },
        { id: 'y', nameKey: 'counter.presets.subhanAllah', target: 99, count: 4, rounds: 2, total: 70 },
      ],
      activeId: 'y',
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    expect(state.counters).toHaveLength(2);
    expect(state.activeId).toBe('y');
    expect(state.counters[0].count).toBe(0);
    expect(state.counters[0].rounds).toBe(0);
    expect(state.counters[0].total).toBe(0);
    expect(typeof state.counters[0].target).toBe('number');
    expect(state.counters[1].count).toBe(4);
    expect(state.counters[1].rounds).toBe(2);
    expect(state.counters[1].total).toBe(70);
  });

  it('increment raises count and total', async () => {
    const mod = await loadAndReset();
    await mod.loadTasbih();
    const res = mod.increment();
    expect(res).toEqual({ completed: false });
    const active = mod.getCachedTasbih().counters.find((c) => c.id === mod.getCachedTasbih().activeId);
    expect(active.count).toBe(1);
    expect(active.total).toBe(1);
  });

  it('rolls over at target (count->0, rounds+1) and returns completed', async () => {
    const stored = {
      counters: [{ id: 'a', nameKey: 'counter.presets.subhanAllah', target: 3, count: 2, rounds: 0, total: 2 }],
      activeId: 'a',
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const mod = await loadAndReset();
    await mod.loadTasbih();
    const res = mod.increment();
    expect(res).toEqual({ completed: true });
    const active = mod.getCachedTasbih().counters[0];
    expect(active.count).toBe(0);
    expect(active.rounds).toBe(1);
    expect(active.total).toBe(3);
  });

  it('target 0 never rolls over', async () => {
    const stored = {
      counters: [{ id: 'a', nameKey: 'counter.presets.counter', target: 0, count: 9, rounds: 0, total: 9 }],
      activeId: 'a',
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const mod = await loadAndReset();
    await mod.loadTasbih();
    const res = mod.increment();
    expect(res).toEqual({ completed: false });
    const active = mod.getCachedTasbih().counters[0];
    expect(active.count).toBe(10);
    expect(active.rounds).toBe(0);
    expect(active.total).toBe(10);
  });

  it('addCounter appends custom counter (nameKey null, name set) and makes it active', async () => {
    const mod = await loadAndReset();
    await mod.loadTasbih();
    const before = mod.getCachedTasbih().counters.length;
    const created = mod.addCounter({ name: 'Salawat', target: 100 });
    const state = mod.getCachedTasbih();
    expect(state.counters).toHaveLength(before + 1);
    expect(created.nameKey).toBeNull();
    expect(created.name).toBe('Salawat');
    expect(created.target).toBe(100);
    expect(created.count).toBe(0);
    expect(created.rounds).toBe(0);
    expect(created.total).toBe(0);
    expect(state.activeId).toBe(created.id);
  });

  it('renameCounter sets name and clears nameKey', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    const target = state.counters[1];
    expect(target.nameKey).toBeTruthy();
    mod.renameCounter(target.id, 'My Dhikr');
    const updated = mod.getCachedTasbih().counters.find((c) => c.id === target.id);
    expect(updated.name).toBe('My Dhikr');
    expect(updated.nameKey).toBeNull();
  });

  it('setTarget updates the target', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    const id = state.counters[1].id;
    mod.setTarget(id, 99);
    const updated = mod.getCachedTasbih().counters.find((c) => c.id === id);
    expect(updated.target).toBe(99);
  });

  it('moveCounter reorders counters', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    const first = state.counters[0].id;
    const second = state.counters[1].id;
    mod.moveCounter(second, 'up');
    const reordered = mod.getCachedTasbih().counters;
    expect(reordered[0].id).toBe(second);
    expect(reordered[1].id).toBe(first);
  });

  it('deleteCounter keeps at least 1 and reassigns activeId when active removed', async () => {
    const stored = {
      counters: [{ id: 'a' }, { id: 'b' }],
      activeId: 'a',
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const mod = await loadAndReset();
    await mod.loadTasbih();
    mod.deleteCounter('a');
    let state = mod.getCachedTasbih();
    expect(state.counters).toHaveLength(1);
    expect(state.counters[0].id).toBe('b');
    expect(state.activeId).toBe('b');
    mod.deleteCounter('b');
    state = mod.getCachedTasbih();
    expect(state.counters).toHaveLength(1);
  });

  it('setActiveId switches the active counter', async () => {
    const mod = await loadAndReset();
    const state = await mod.loadTasbih();
    const targetId = state.counters[2].id;
    mod.setActiveId(targetId);
    expect(mod.getCachedTasbih().activeId).toBe(targetId);
  });

  it('getCounterDisplayName resolves nameKey or literal name', async () => {
    const mod = await loadAndReset();
    expect(mod.getCounterDisplayName({ nameKey: 'counter.presets.subhanAllah', name: null })).toBe('counter.presets.subhanAllah');
    expect(mod.getCounterDisplayName({ nameKey: null, name: 'Custom' })).toBe('Custom');
    expect(mod.getCounterDisplayName(null)).toBe('');
  });

  it('persists to AsyncStorage after an action (debounced)', async () => {
    const mod = await loadAndReset();
    await mod.loadTasbih();
    AsyncStorage.setItem.mockClear();
    jest.useFakeTimers();
    mod.increment();
    jest.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@tasbih_counters', expect.any(String));
    jest.useRealTimers();
  });
});
