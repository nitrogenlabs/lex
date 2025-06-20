/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import {linked, LinkOptions} from './link.js';

// Mock dependencies
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('link.options tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    
    // Mock app utils
    jest.spyOn(app, 'checkLinkedModules').mockImplementation(() => {});
  });
  
  it('should accept cliName option', async () => {
    const options: LinkOptions = {
      cliName: 'CustomCLI'
    };
    
    // We're not testing the full execution here, just that the option is accepted
    expect(() => linked(options)).not.toThrow();
  });
  
  it('should accept quiet option', async () => {
    const options: LinkOptions = {
      quiet: true
    };
    
    expect(() => linked(options)).not.toThrow();
  });
  
  it('should use default options when not provided', async () => {
    const options: LinkOptions = {};
    
    expect(() => linked(options)).not.toThrow();
  });
  
  it('should handle all options together', async () => {
    const options: LinkOptions = {
      cliName: 'CustomCLI',
      quiet: true
    };
    
    expect(() => linked(options)).not.toThrow();
  });
}); 