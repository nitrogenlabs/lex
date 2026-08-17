import {mkdirSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {LexSvgSpritemap} from './LexSvgSpritemap.js';

describe('LexSvgSpritemap', () => {
  const directory = join(tmpdir(), 'lex-spritemap-test');

  beforeEach(() => mkdirSync(directory, {recursive: true}));
  afterEach(() => rmSync(directory, {force: true, recursive: true}));

  it('builds optimized symbols and preserves namespaces', () => {
    writeFileSync(join(directory, 'check.svg'), '<svg viewBox="0 0 10 10" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0 0h2v2z"/></svg>');
    const result = new LexSvgSpritemap(join(directory, '*.svg'), {prefix: 'icon-'}).buildSpritemap();

    expect(result.content).toContain('<symbol id="icon-check"');
    expect(result.warnings).toHaveLength(0);
  });

  it('derives viewBox values and de-duplicates identifiers', () => {
    mkdirSync(join(directory, 'a'));
    mkdirSync(join(directory, 'b'));
    writeFileSync(join(directory, 'a/icon.svg'), '<svg width="20" height="10"><path d="M0 0h2v2z"/></svg>');
    writeFileSync(join(directory, 'b/icon.svg'), '<svg viewBox="0 0 5 5"><path d="M0 0h1v1z"/></svg>');
    const result = new LexSvgSpritemap(join(directory, '**/*.svg'), {optimize: false}).buildSpritemap();

    expect(result.content).toContain('viewBox="0 0 20 10"');
    expect(result.content).toContain('id="icon-2"');
    expect(result.warnings.some(({message}) => message.includes('Duplicate SVG icon'))).toBe(true);
  });

  it('reports invalid and empty SVG files', () => {
    writeFileSync(join(directory, 'invalid.svg'), '<div/>');
    writeFileSync(join(directory, 'empty.svg'), '<svg viewBox="0 0 1 1"></svg>');
    writeFileSync(join(directory, 'missing-size.svg'), '<svg><path d="M0 0"/></svg>');
    const result = new LexSvgSpritemap(join(directory, '*.svg')).buildSpritemap();

    expect(result.content).toBeNull();
    expect(result.warnings.map(({message}) => message)).toEqual(expect.arrayContaining([
      expect.stringContaining('Invalid SVG icon'),
      expect.stringContaining('SVG icon is empty'),
      expect.stringContaining('missing a viewBox')
    ]));
  });

  it('returns an empty result when no files match', () => {
    expect(new LexSvgSpritemap(join(directory, '*.svg')).buildSpritemap()).toEqual({
      content: null,
      filePaths: [],
      warnings: []
    });
  });
});
