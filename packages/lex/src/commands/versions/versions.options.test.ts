/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {VersionsCmd} from './versions.js';

describe('versions.options', () => {
  it('should have the correct options structure', () => {
    const options: VersionsCmd = {
      json: true
    };

    expect(options).toHaveProperty('json');
    expect(options.json).toBe(true);
  });

  it('should allow empty options', () => {
    const options: VersionsCmd = {};

    expect(options).toEqual({});
    expect(options.json).toBeUndefined();
  });
});