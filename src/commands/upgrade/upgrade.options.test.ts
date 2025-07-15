/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {UpgradeOptions} from './upgrade.js';

describe('upgrade.options', () => {
  it('should have the correct options structure', () => {
    const options: UpgradeOptions = {
      cliName: 'TestCLI',
      cliPackage: '@custom/cli',
      quiet: false
    };

    expect(options).toHaveProperty('cliName');
    expect(options).toHaveProperty('cliPackage');
    expect(options).toHaveProperty('quiet');
  });

  it('should allow partial options', () => {
    const options: UpgradeOptions = {
      cliPackage: '@custom/cli'
    };

    expect(options).toHaveProperty('cliPackage', '@custom/cli');
    expect(options.cliName).toBeUndefined();
    expect(options.quiet).toBeUndefined();
  });

  it('should allow empty options', () => {
    const options: UpgradeOptions = {};

    expect(options).toEqual({});
  });
});