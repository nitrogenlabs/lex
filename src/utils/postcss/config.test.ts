import postcss from 'postcss';

import config from '../../../postcss.config.js';

describe('PostCSS config', () => {
  it('uses the Tailwind 4 PostCSS plugin without the legacy plugin chain', () => {
    expect(config.plugins.map(({postcssPlugin}) => postcssPlugin)).toEqual(['@tailwindcss/postcss']);
  });

  it('preserves source paths while processing third-party CSS', async () => {
    const from = '/project/node_modules/example-package/styles.css';
    const result = await postcss(config.plugins).process('.lightbox { color: white; }', {from});
    const sourceFiles: Array<string | undefined> = [];

    result.root.walkDecls((declaration) => sourceFiles.push(declaration.source?.input.file));

    expect(sourceFiles).toEqual([from]);
  });
});
