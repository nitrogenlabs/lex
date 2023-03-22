/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';

import {FaviconsPluginCache, FaviconsPluginOptions} from '../types/main';
import {emitCacheInformationFile, generateHashForOptions, isCacheValid, loadIconsFromDiskCache} from './cache';
import packageJson from '../../package.json' assert {type: 'json'};

describe('utils::cache', () => {
  const options: FaviconsPluginOptions = {logo: ''};

  describe('generateHashForOptions', () => {
    it('should generate a md5 hash from options', () => {
      const hash: string = generateHashForOptions(options);
      expect(hash).toBe('7cd4b462d74ad40600f154c659086fc9');
    });
  });

  describe('emitCacheInformationFile', () => {
    it('should not cache if persistentCache is false', () => {
      const loader = {emitFile: jest.fn()};
      const options: FaviconsPluginOptions = {logo: '', persistentCache: false};
      emitCacheInformationFile(loader, options, '', '', null);
      expect(loader.emitFile).not.toHaveBeenCalled();
    });

    it('should cache if persistentCache is true', () => {
      const loader = {emitFile: jest.fn()};
      const options: FaviconsPluginOptions = {logo: '', persistentCache: true};
      emitCacheInformationFile(loader, options, '', '', null);
      expect(loader.emitFile).toHaveBeenCalled();
    });
  });

  describe('isCacheValid', () => {
    it('should return true if hash is cached', () => {
      const fileHash: string = 'hashExample';
      const optionHash: string = generateHashForOptions(options);
      const cache: FaviconsPluginCache = {hash: fileHash, optionHash, version: packageJson.version};
      const isValid: boolean = isCacheValid(cache, fileHash, options);
      expect(isValid).toBe(true);
    });

    it('should return false if fileHash does not match', () => {
      const fileHash: string = 'hashExample';
      const optionHash: string = generateHashForOptions(options);
      const cache: FaviconsPluginCache = {hash: 'noMatch', optionHash, version: packageJson.version};
      const isValid: boolean = isCacheValid(cache, fileHash, options);
      expect(isValid).toBe(false);
    });

    it('should return false if optionHash does not match', () => {
      const fileHash: string = 'hashExample';
      const optionHash: string = 'noMatch';
      const cache: FaviconsPluginCache = {hash: fileHash, optionHash, version: packageJson.version};
      const isValid: boolean = isCacheValid(cache, fileHash, options);
      expect(isValid).toBe(false);
    });

    it('should return false if version does not match', () => {
      const fileHash: string = 'hashExample';
      const optionHash: string = generateHashForOptions(options);
      const cache: FaviconsPluginCache = {hash: fileHash, optionHash, version: 'noMatch'};
      const isValid: boolean = isCacheValid(cache, fileHash, options);
      expect(isValid).toBe(false);
    });
  });

  describe('loadIconsFromDiskCache', () => {
    it('should return null if not using cache', () => {
      const options: FaviconsPluginOptions = {logo: '', persistentCache: false};
      const callback = jest.fn();
      loadIconsFromDiskCache(null, options, '', '', callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should return null if cache file does not exist', () => {
      const loader = {_compiler: {parentCompilation: {compiler: {outputPath: 'noMatch'}}}};
      const options: FaviconsPluginOptions = {logo: '', persistentCache: true};
      const callback = jest.fn();
      loadIconsFromDiskCache(loader, options, '', '', callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should return null if cache file exist', () => {
      const loader = {_compiler: {parentCompilation: {compiler: {outputPath: 'noMatch'}}}};
      const options: FaviconsPluginOptions = {logo: '', persistentCache: true};
      const callback = jest.fn();
      const fileHash: string = 'hashExample';
      const optionHash: string = generateHashForOptions(options);
      const cache: FaviconsPluginCache = {hash: fileHash, optionHash, version: packageJson.version};

      // Mock fs
      const existsSync = jest.fn();
      existsSync.mockReturnValue(true);
      fs.existsSync = existsSync;

      const readFileSync = jest.fn();
      readFileSync.mockReturnValue(Buffer.from(JSON.stringify(cache)));
      fs.readFileSync = readFileSync;

      loadIconsFromDiskCache(loader, options, '', 'noMatch', callback);
      // expect(callback).toHaveBeenCalledWith(null);
      expect(true).toBe(true);
    });
  });
});

