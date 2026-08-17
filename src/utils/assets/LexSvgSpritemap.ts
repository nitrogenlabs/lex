/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {basename as pathBasename, extname as pathExtname, resolve as pathResolve} from 'path';
import {optimize} from 'svgo';

type IdentifierPrefix = false | string | ((filePath: string) => string);

export interface LexSvgSpritemapOptions {
  readonly allowDuplicates?: boolean;
  readonly filename?: string;
  readonly optimize?: boolean;
  readonly prefix?: IdentifierPrefix;
}

interface ParsedSvg {
  readonly attributes: Record<string, string>;
  readonly content: string;
}

interface SpriteSymbol {
  readonly filePath: string;
  readonly namespaceAttributes: Record<string, string>;
  readonly symbol: string;
}

const DEFAULT_FILENAME = 'icons/icons.svg';
const ROOT_EXCLUDED_ATTRIBUTES = new Set([
  'height',
  'id',
  'version',
  'viewBox',
  'width',
  'xmlns'
]);

const escapeAttribute = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
};

const normalizeAssetFilename = (filename: string): string => {
  return filename.replace(/^[./]+/, '');
};

const parseAttributes = (input: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const attributeRegex = /([:@\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

  let match: RegExpExecArray | null = attributeRegex.exec(input);
  while(match) {
    attributes[match[1]] = match[3] ?? match[4] ?? '';
    match = attributeRegex.exec(input);
  }

  return attributes;
};

const parseSvg = (source: string): ParsedSvg | null => {
  const svgMatch = source
    .replace(/<\?xml[\s\S]*?\?>/ig, '')
    .replace(/<!doctype[\s\S]*?>/ig, '')
    .match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

  if(!svgMatch) {
    return null;
  }

  return {
    attributes: parseAttributes(svgMatch[1] || ''),
    content: svgMatch[2]?.trim() || ''
  };
};

const buildAttributeString = (attributes: Record<string, string>): string => {
  return Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(' ');
};

const sanitizeIdentifier = (value: string): string => {
  const sanitizedValue = value
    .trim()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^A-Za-z0-9_-]/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^[-_]+|[-_]+$/g, '');

  const safeValue = sanitizedValue || 'icon';

  return /^[A-Za-z_]/.test(safeValue) ? safeValue : `icon-${safeValue}`;
};

const getPrefix = (filePath: string, prefix: IdentifierPrefix): string => {
  if(prefix === false) {
    return '';
  }

  if(typeof prefix === 'function') {
    return prefix(filePath);
  }

  return prefix || '';
};

const optimizeSvg = (content: string, enabled: boolean): string => {
  if(!enabled) {
    return content;
  }

  return optimize(content, {
    multipass: true,
    plugins: [{
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          removeHiddenElems: false
        }
      }
    }]
  }).data;
};

const createSpriteSymbol = (
  filePath: string,
  usedIdentifiers: Set<string>,
  prefix: IdentifierPrefix,
  warnings: Error[]
): SpriteSymbol | null => {
  const source = readFileSync(filePath, 'utf8');
  const parsedSvg = parseSvg(source);

  if(!parsedSvg) {
    warnings.push(new Error(`Invalid SVG icon: ${filePath}`));
    return null;
  }

  if(!parsedSvg.content) {
    warnings.push(new Error(`SVG icon is empty: ${filePath}`));
    return null;
  }

  const rawIdentifier = `${getPrefix(filePath, prefix)}${pathBasename(filePath, pathExtname(filePath))}`;
  const baseIdentifier = sanitizeIdentifier(rawIdentifier);

  let identifier = baseIdentifier;
  let duplicateIndex = 1;

  while(usedIdentifiers.has(identifier)) {
    duplicateIndex += 1;
    identifier = `${baseIdentifier}-${duplicateIndex}`;
  }

  if(identifier !== baseIdentifier) {
    warnings.push(new Error(`Duplicate SVG icon id "${baseIdentifier}" detected, using "${identifier}" for ${filePath}`));
  }

  usedIdentifiers.add(identifier);

  const namespaceAttributes = Object.entries(parsedSvg.attributes).reduce<Record<string, string>>((result, [name, value]) => {
    if(name.toLowerCase().startsWith('xmlns:')) {
      result[name] = value;
    }

    return result;
  }, {});

  const symbolAttributes = Object.entries(parsedSvg.attributes).reduce<Record<string, string>>((result, [name, value]) => {
    if(ROOT_EXCLUDED_ATTRIBUTES.has(name)) {
      return result;
    }

    if(name.toLowerCase().startsWith('xmlns:')) {
      return result;
    }

    result[name] = value;

    return result;
  }, {
    id: identifier
  });

  if(parsedSvg.attributes.viewBox) {
    symbolAttributes.viewBox = parsedSvg.attributes.viewBox;
  } else {
    const width = Number.parseFloat(parsedSvg.attributes.width || '');
    const height = Number.parseFloat(parsedSvg.attributes.height || '');

    if(Number.isFinite(width) && Number.isFinite(height)) {
      symbolAttributes.viewBox = `0 0 ${width} ${height}`;
    } else {
      warnings.push(new Error(`SVG icon is missing a viewBox and readable width/height: ${filePath}`));
      return null;
    }
  }

  return {
    filePath,
    namespaceAttributes,
    symbol: `<symbol ${buildAttributeString(symbolAttributes)}>${parsedSvg.content}</symbol>`
  };
};

const collectFiles = (patterns: readonly string[], allowDuplicates: boolean): string[] => {
  const files = patterns.flatMap((pattern) => {
    return globSync(pattern, {
      absolute: true,
      dot: false,
      nodir: true
    }) as string[];
  }).map((filePath) => pathResolve(filePath));

  if(allowDuplicates) {
    return files;
  }

  return [...new Set(files)];
};

export class LexSvgSpritemap {
  readonly patterns: string[];
  readonly options: Required<LexSvgSpritemapOptions>;

  constructor(patterns: string | string[], options: LexSvgSpritemapOptions = {}) {
    this.patterns = Array.isArray(patterns) ? patterns : [patterns];
    this.options = {
      allowDuplicates: options.allowDuplicates ?? false,
      filename: normalizeAssetFilename(options.filename || DEFAULT_FILENAME),
      optimize: options.optimize ?? true,
      prefix: options.prefix ?? false
    };
  }

  buildSpritemap(): {content: string | null; filePaths: string[]; warnings: Error[]} {
    const warnings: Error[] = [];
    const filePaths = collectFiles(this.patterns, this.options.allowDuplicates);

    if(filePaths.length === 0) {
      return {
        content: null,
        filePaths,
        warnings
      };
    }

    const namespaceAttributes: Record<string, string> = {};
    const usedIdentifiers = new Set<string>();
    const symbols = filePaths.map((filePath) => {
      return createSpriteSymbol(filePath, usedIdentifiers, this.options.prefix, warnings);
    }).filter((entry): entry is SpriteSymbol => entry !== null);

    if(symbols.length === 0) {
      return {
        content: null,
        filePaths,
        warnings
      };
    }

    for(const symbol of symbols) {
      for(const [name, value] of Object.entries(symbol.namespaceAttributes)) {
        namespaceAttributes[name] = value;
      }
    }

    const rootAttributes = buildAttributeString({
      xmlns: 'http://www.w3.org/2000/svg',
      ...namespaceAttributes
    });
    const spriteContent = `<svg ${rootAttributes}>${symbols.map((symbol) => symbol.symbol).join('')}</svg>`;

    return {
      content: optimizeSvg(spriteContent, this.options.optimize),
      filePaths,
      warnings
    };
  }

}

export default LexSvgSpritemap;
