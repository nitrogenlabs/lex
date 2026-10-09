import {readFileSync} from 'fs';
import {resolve} from 'path';

describe('Vitest dependencies', () => {
  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

  it('provides Vitest and its matching coverage provider', () => {
    expect(packageJson.dependencies.vitest).toBe('4.1.11');
    expect(packageJson.dependencies['@vitest/coverage-v8']).toBe(packageJson.dependencies.vitest);
  });

  it('bundles the runner without requiring a consumer peer install', () => {
    expect(packageJson.peerDependencies).toBeUndefined();
    expect(packageJson.peerDependenciesMeta?.vitest?.optional).not.toBe(true);
  });
});
