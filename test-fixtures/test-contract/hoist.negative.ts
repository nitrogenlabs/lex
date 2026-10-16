import {source} from './subject.js';

// Deliberately too late to affect the static import: proves the positive needs hoisting.
vi.doMock('./subject.js', () => ({source: () => 'hoisted'}));
test('non-hoisted control cannot replace a static import', () => {
  expect(source()).toBe('hoisted');
});
