/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {linked, LinkOptions} from './link.js';

// Mock dependencies
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('link.cli tests', () => {
  let mockCallback: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    
    // Mock app utils
    jest.spyOn(app, 'checkLinkedModules').mockImplementation(() => {});
    
    // Mock callback
    mockCallback = jest.fn();
  });
  
  it('should check for linked modules with default options', async () => {
    const options: LinkOptions = {};
    
    const result = await linked(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex checking for linked modules...', 'info', undefined);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.checkLinkedModules).toHaveBeenCalled();
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should use custom CLI name when provided', async () => {
    const options: LinkOptions = {
      cliName: 'CustomCLI'
    };
    
    await linked(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('CustomCLI checking for linked modules...', 'info', undefined);
  });
  
  it('should respect quiet option', async () => {
    const options: LinkOptions = {
      quiet: true
    };
    
    await linked(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
  });
  
  it('should work without a callback', async () => {
    const options: LinkOptions = {};
    
    const result = await linked(options);
    
    expect(result).toBe(0);
  });
}); 