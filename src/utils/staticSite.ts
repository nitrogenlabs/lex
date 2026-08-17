/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, mkdirSync, writeFileSync} from 'fs';
import {posix as path, resolve} from 'path';

export type StaticRenderOutput = Record<string, string> | string;
export type StaticRender = ((locals: StaticRenderLocals) => Promise<StaticRenderOutput> | StaticRenderOutput) |
  ((locals: StaticRenderLocals, callback: (output: StaticRenderOutput) => void) => void);

export interface StaticRenderLocals {
  readonly assets: Record<string, string>;
  readonly path: string;
}

export interface StaticSiteOptions {
  readonly assets?: Record<string, string>;
  readonly crawl?: boolean;
  readonly outputPath: string;
  readonly paths?: string[] | string;
  readonly render: StaticRender;
}

const attributeValues = (html: string, element: string, attribute: string): string[] => {
  const expression = new RegExp(`<${element}\\b[^>]*\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'gi');
  const values: string[] = [];
  let match = expression.exec(html);

  while(match) {
    values.push(match[1] ?? match[2] ?? match[3]);
    match = expression.exec(html);
  }

  return values;
};

export const relativePathsFromHtml = (currentPath: string, source: string): string[] => [
  ...attributeValues(source, 'a', 'href'),
  ...attributeValues(source, 'iframe', 'src')
]
  .filter((reference) => reference.length > 0 && !reference.startsWith('#') && !reference.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(reference))
  .map((reference) => {
    const resolved = new URL(reference, new URL(currentPath, 'https://lex.local'));
    return `${resolved.pathname}${resolved.search}`;
  });

const pathToAssetName = (outputPath: string): string => {
  let outputFileName = outputPath.replace(/^(\/|\\)/, '');
  if(!/\.(html?)$/i.test(outputFileName)) {
    outputFileName = path.join(outputFileName, 'index.html');
  }
  return outputFileName;
};

const invokeRender = async (render: StaticRender, locals: StaticRenderLocals): Promise<StaticRenderOutput> => {
  if(render.length < 2) {
    return Promise.resolve((render as (
      renderLocals: StaticRenderLocals
    ) => Promise<StaticRenderOutput> | StaticRenderOutput)(locals));
  }

  return new Promise<StaticRenderOutput>((resolveOutput) => {
    (render as (
      renderLocals: StaticRenderLocals,
      callback: (value: StaticRenderOutput) => void
    ) => void)(locals, resolveOutput);
  });
};

export const renderStaticSite = async (options: StaticSiteOptions): Promise<void> => {
  const {assets = {}, crawl = true, outputPath, paths = ['/'], render} = options;
  const pending = Array.isArray(paths) ? [...paths] : [paths];
  const renderedPaths = new Set<string>();

  while(pending.length > 0) {
    const currentPath = pending.shift();
    if(!currentPath || renderedPaths.has(currentPath)) {
      continue;
    }
    renderedPaths.add(currentPath);

    const locals = {assets, path: currentPath};
    // Rendering is sequential because each page can enqueue newly discovered routes.
    // eslint-disable-next-line no-await-in-loop
    const output = await invokeRender(render, locals);
    const outputByPath = typeof output === 'object' ? output : {[currentPath]: output};

    for(const [renderedPath, html] of Object.entries(outputByPath)) {
      const assetName = pathToAssetName(renderedPath);
      const filePath = resolve(outputPath, assetName);
      if(!existsSync(filePath)) {
        mkdirSync(resolve(filePath, '..'), {recursive: true});
        writeFileSync(filePath, html);
      }

      if(crawl) {
        pending.push(...relativePathsFromHtml(renderedPath, html));
      }
    }
  }
};
