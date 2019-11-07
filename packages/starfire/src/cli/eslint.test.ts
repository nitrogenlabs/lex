import * as eslint from './eslint';

describe('eslint', () => {
  it('should run standalone', () => {
    eslint.run(['-g', 'test', '-c', 'config.js']);
    expect(true).toEqual(true);
  });
});
