import {source} from './subject.js';

const state = vi.hoisted(() => ({value: 'hoisted'}));
vi.mock('./subject.js', () => ({source: () => state.value}));

test('global hoisted mock replaces a statically imported implementation', () => {
  expect(source()).toBe('hoisted');
  state.value = 'changed';
  expect(source()).toBe('changed');
});
