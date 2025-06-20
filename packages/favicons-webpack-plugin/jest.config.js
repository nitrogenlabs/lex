/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseConfigPath = resolve(__dirname, '../../jest.config.base.js');
const baseConfig = JSON.parse(readFileSync(baseConfigPath, 'utf8'));
const packagePath = resolve(__dirname, './package.json');
const pack = JSON.parse(readFileSync(packagePath, 'utf8'));

export default {
  ...baseConfig,
  displayName: pack.name,
  rootDir: '../..',
  testMatch: ['<rootDir>/packages/favicons-webpack-plugin/**/*.test.ts']
};
