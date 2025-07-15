/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {linked} from './link.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('link.integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);

    // Mock app utils
    jest.spyOn(app, 'checkLinkedModules').mockImplementation(() => {});
  });

  it('should execute the full linked modules workflow', async () => {
    // Setup the test
    const options = {
      quiet: false
    };

    // Execute the command
    const result = await linked(options);

    // Verify the workflow
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('checking for linked modules'), 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.checkLinkedModules).toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle the quiet mode correctly', async () => {
    // Setup the test with quiet mode enabled
    const options = {
      quiet: true
    };

    // Execute the command
    await linked(options);

    // Verify quiet mode is respected
    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
  });
});