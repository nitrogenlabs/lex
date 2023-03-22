import {build} from './build.js';

describe('build', () => {
  it('should', async () => {
    const status: number = await build({cliName: 'Test'}, Promise.resolve);
    expect(status).toBe(1);
  });
});
