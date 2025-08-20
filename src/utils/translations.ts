/**
 * Copyright (c) 2025-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';

import {log} from './log.js';

const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
  let flattened: Record<string, string> = {};

  for(const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if(typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattened = {...flattened, ...flattenTranslations(value, newKey)};
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
};

const findTranslationFiles = (sourcePath: string): string[] => {
  const patterns = [
    '**/translations/*.json',
    '**/i18n/*.json',
    '**/locales/*.json',
    '**/lang/*.json'
  ];

  const files: string[] = [];

  patterns.forEach((pattern) => {
    try {
      const matches = globSync(pattern, {
        absolute: true,
        cwd: sourcePath,
        nodir: true
      });
      files.push(...matches);
    } catch {
    }
  });

  return files;
};

export const processTranslations = async (
  sourcePath: string,
  outputPath: string,
  quiet: boolean = false
): Promise<void> => {
  if(!existsSync(sourcePath)) {
    log(`Source path does not exist: ${sourcePath}`, 'error', quiet);
    return;
  }

  log('Finding translation files...', 'info', quiet);

  const translationFiles = findTranslationFiles(sourcePath);

  if(translationFiles.length === 0) {
    log('No translation files found', 'warn', quiet);
    return;
  }

  log(`Found ${translationFiles.length} translation files`, 'info', quiet);

  let allTranslations: Record<string, any> = {};

  for(const filePath of translationFiles) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      allTranslations = {...allTranslations, ...data};

      log(`Processed: ${filePath}`, 'info', quiet);
    } catch (error) {
      log(`Error processing ${filePath}: ${error.message}`, 'error', quiet);
    }
  }

  const flattenedTranslations = flattenTranslations(allTranslations);
  const outputFile = pathResolve(outputPath, 'translations.json');

  try {
    const outputDir = pathResolve(outputPath);

    if(!existsSync(outputDir)) {
      mkdirSync(outputDir, {recursive: true});
    }

    writeFileSync(outputFile, JSON.stringify(flattenedTranslations, null, 2), 'utf8');
    log(`Translations written to: ${outputFile}`, 'info', quiet);
  } catch (error) {
    log(`Error writing translations file: ${error.message}`, 'error', quiet);
  }

  const srcDir = pathResolve(sourcePath, 'src');
  const srcOutputFile = existsSync(srcDir) ? pathResolve(srcDir, 'translations.json') : pathResolve(sourcePath, 'translations.json');

  try {
    const ensureDir = existsSync(srcDir) ? srcDir : sourcePath;

    if(!existsSync(ensureDir)) {
      mkdirSync(ensureDir, {recursive: true});
    }

    writeFileSync(srcOutputFile, JSON.stringify(flattenedTranslations, null, 2), 'utf8');
    log(`Translations written to: ${srcOutputFile}`, 'info', quiet);
  } catch (error) {
    log(`Error writing translations file to src: ${error.message}`, 'error', quiet);
  }
};