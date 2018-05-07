import {SampleStore} from './SampleStore';

describe('SampleStore', () => {
  const store = new SampleStore();

  describe('#onAction', () => {
    it('should listen for UPDATE', () => {
      const state = store.initialState();
      const updatedState = store.onAction('UPDATE', {}, state);
      return expect(updatedState).toBe(state);
    });
  });
});
