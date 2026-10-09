import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import postcss from 'postcss';

import config from '../../postcss.config.js';

describe('Security dependency compatibility', () => {
  it('compiles Typography styles and pseudo-element variants with the patched selector parser', async () => {
    const result = await postcss(config.plugins).process([
      '@import "tailwindcss";',
      '@plugin "@tailwindcss/typography";',
      '@source inline("prose prose-lg prose-headings:underline prose-a:hover:underline");'
    ].join('\n'), {from: resolve('security-compatibility.css')});

    expect(result.css).toContain('.prose');
    expect(result.css).toContain('::marker');
    expect(result.css).toContain('text-decoration-line: underline');
    expect(result.warnings()).toEqual([]);
  });

  it('renders inline and display math through the Markdown extension with patched KaTeX', async () => {
    const require = createRequire(resolve('package.json'));
    const markdownRequire = createRequire(require.resolve('@eslint/markdown'));
    const {math, mathHtml} = await import(pathToFileURL(markdownRequire.resolve('micromark-extension-math')).href);
    const {micromark} = await import(pathToFileURL(markdownRequire.resolve('micromark')).href);
    const html = micromark('Inline $x^2$.\n\n$$\n\\frac{1}{2}\n$$', {
      extensions: [math()],
      htmlExtensions: [mathHtml()]
    });

    expect(html).toContain('math-inline');
    expect(html).toContain('katex-display');
    expect(html).toContain('<math');
    expect(html).not.toContain('katex-error');
  });
});
