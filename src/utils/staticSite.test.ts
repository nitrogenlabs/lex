import {existsSync, mkdirSync, readFileSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {relativePathsFromHtml, renderStaticSite} from './staticSite.js';

describe('static site rendering', () => {
  const outputPath = join(tmpdir(), 'lex-static-site-test');

  beforeEach(() => mkdirSync(outputPath, {recursive: true}));

  afterEach(() => rmSync(outputPath, {force: true, recursive: true}));

  it('discovers local links while ignoring external links and fragments', () => {
    expect(relativePathsFromHtml('/', '<a href="/about">About</a><iframe src="docs"></iframe><a href="https://example.com">External</a><a href="#top">Top</a>'))
      .toEqual(['/about', '/docs']);
  });

  it('renders and crawls pages', async () => {
    await renderStaticSite({
      outputPath,
      render: ({path}) => (path === '/'
        ? '<a href="/about">About</a>'
        : `<main>${path}</main>`)
    });

    expect(existsSync(join(outputPath, 'index.html'))).toBe(true);
    expect(readFileSync(join(outputPath, 'about/index.html'), 'utf8')).toContain('/about');
  });

  it('supports callback renderers', async () => {
    await renderStaticSite({
      crawl: false,
      outputPath,
      render: (_locals, callback) => callback('callback output')
    });

    expect(readFileSync(join(outputPath, 'index.html'), 'utf8')).toBe('callback output');
  });
});
