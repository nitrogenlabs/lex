import {build} from './build';

jest.mock('execa');

describe('build', () => {
  it('should', async () => {
    const status: number = await build({babel: 'custom.babel.js'}, Promise.resolve);
    expect(status).toBe(1);
  });
});
