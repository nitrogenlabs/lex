import * as original from '@playwright/test';
import {expect, test} from 'vitest';

import manifest from '../../package.json';
import * as bindings from './index.js';

test('declares the test-only public Playwright entry and public declaration path', () => {
  expect(manifest.exports).toMatchObject({'./test-playwright': {
    import: './lib/test-playwright/index.js', types: './lib/test-playwright/index.d.ts'
  }});
});

test('reexports the exact installed runner/config/assertion bindings without a parallel framework instance', () => {
  expect(bindings.test).toBe(original.test);
  expect(bindings.expect).toBe(original.expect);
  expect(bindings.defineConfig).toBe(original.defineConfig);
  expect(bindings.devices).toBe(original.devices);
});
