/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {dirname, resolve as pathResolve} from 'path';

import {log} from './log.js';



/**
 * Flattens a nested object into dot notation format
 */
const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
  const flattened: Record<string, string> = {};

  for(const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if(typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenTranslations(value, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
};

/**
 * Finds all translation files in the project
 */
const findTranslationFiles = (sourcePath: string): string[] => {
  const patterns = [
    '**/translations/*.json',
    '**/i18n/*.json',
    '**/locales/*.json',
    '**/lang/*.json'
  ];

  const files: string[] = [];

  patterns.forEach(pattern => {
    try {
      const matches = globSync(pattern, {
        cwd: sourcePath,
        absolute: true,
        nodir: true
      });
      files.push(...matches);
    } catch(error) {
      // Pattern not found, continue
    }
  });

  return files;
};



/**
 * Processes all translation files and creates flattened output
 */
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

  const allTranslations: Record<string, any> = {};

  // Process each translation file
  for(const filePath of translationFiles) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Merge all translations into a single object
      Object.assign(allTranslations, data);

      log(`Processed: ${filePath}`, 'info', quiet);
    } catch(error) {
      log(`Error processing ${filePath}: ${error.message}`, 'error', quiet);
    }
  }

  // Flatten all translations into a single object
  const flattenedTranslations = flattenTranslations(allTranslations);

  // Write the flattened translations to output file
  const outputFile = pathResolve(outputPath, 'translations.json');

  try {
    writeFileSync(outputFile, JSON.stringify(flattenedTranslations, null, 2), 'utf8');
    log(`Translations written to: ${outputFile}`, 'info', quiet);
  } catch(error) {
    log(`Error writing translations file: ${error.message}`, 'error', quiet);
  }
};