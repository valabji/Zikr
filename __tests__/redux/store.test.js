// The global jest.setup.js mocks ./redux/store — unmock it so we can test the real reducer.
jest.unmock('../../redux/store');

import { mystore } from '../../redux/store';

describe('redux/store', () => {
  it('has an initial state shape compatible with consumers', () => {
    const state = mystore.getState();
    expect(state).toHaveProperty('obj');
    expect(state.obj).toHaveProperty('Azkar');
  });

  it('replaces obj when a "change" action is dispatched', () => {
    mystore.dispatch({ type: 'change', obj: { Azkar: ['a', 'b'], extra: true } });
    expect(mystore.getState().obj).toEqual({ Azkar: ['a', 'b'], extra: true });
  });

  it('does not crash on unknown action types', () => {
    const before = mystore.getState();
    mystore.dispatch({ type: 'totally-unknown-action' });
    // The reducer returns state unchanged for unknown types
    expect(mystore.getState()).toEqual(before);
  });
});
