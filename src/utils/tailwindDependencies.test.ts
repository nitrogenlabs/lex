import {readFileSync} from 'fs';
import {resolve} from 'path';

describe('Tailwind dependencies', () => {
  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

  it('provides the shared Tailwind plugin toolchain', () => {
    expect(packageJson.dependencies).toEqual(expect.objectContaining({
      '@tailwindcss/forms': expect.any(String),
      '@tailwindcss/postcss': expect.any(String),
      '@tailwindcss/typography': expect.any(String)
    }));
  });
});
