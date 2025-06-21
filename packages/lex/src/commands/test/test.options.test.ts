/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import path from 'path';
import {URL} from 'url';

import {test, TestOptions} from './test.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as logUtils from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');
jest.mock('../ai/ai.js');

// Mock glob module
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));

describe('test options tests', () => {
  let mockSpinner: any;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    (LexConfig.config as any) = {
      useTypescript: true
    };
    (LexConfig.checkTypescriptConfig as jest.Mock).mockImplementation(() => {});

    // Mock URL
    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as unknown as URL));

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockReturnValue('/node_modules/jest-cli/bin/jest.js');

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'test results',
      stderr: ''
    });

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should pass bail option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      bail: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--bail');
  });

  it('should pass changedFilesWithAncestor option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      changedFilesWithAncestor: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--changedFilesWithAncestor');
  });

  it('should pass changedSince option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      changedSince: 'main'
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--changedSince');
  });

  it('should pass ci option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      ci: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--ci');
  });

  it('should pass collectCoverageFrom option to Jest when specified', async () => {
    const coveragePattern = 'src/**/*.{ts,tsx}';
    const options: TestOptions = {
      quiet: false,
      collectCoverageFrom: coveragePattern
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--collectCoverageFrom');
    expect(jestArgs).toContain(coveragePattern);
  });

  it('should pass colors option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      colors: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--colors');
  });

  it('should pass config option to Jest when specified', async () => {
    const customConfig = './custom-jest.config.js';
    const options: TestOptions = {
      quiet: false,
      config: customConfig
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--config');
    expect(jestArgs).toContain(customConfig);
  });

  it('should pass debug option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      debug: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--debug');
  });

  it('should pass detectOpenHandles option to Jest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      detectOpenHandles: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--detectOpenHandles');
  });

  it('should handle multiple options correctly', async () => {
    const options: TestOptions = {
      quiet: false,
      bail: true,
      ci: true,
      colors: true,
      verbose: true,
      detectOpenHandles: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--bail');
    expect(jestArgs).toContain('--ci');
    expect(jestArgs).toContain('--colors');
    expect(jestArgs).toContain('--verbose');
    expect(jestArgs).toContain('--detectOpenHandles');
  });

  it('should handle custom CLI name', async () => {
    const options: TestOptions = {
      quiet: false,
      cliName: 'CustomTester'
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(logUtils.log).toHaveBeenCalledWith('CustomTester testing...', 'info', false);
  });

  it('should skip TypeScript checks when useTypescript is false', async () => {
    (LexConfig.config as any).useTypescript = false;

    const options: TestOptions = {
      quiet: false
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(LexConfig.checkTypescriptConfig).not.toHaveBeenCalled();
  });

  it('should handle custom setup file', async () => {
    const setupFile = './custom-setup.js';
    const options: TestOptions = {
      quiet: false,
      setup: setupFile
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain(`--setupFilesAfterEnv=${path.resolve(process.cwd(), setupFile)}`);
  });

  it('should handle watch option', async () => {
    const watchPattern = 'src/**/*.ts';
    const options: TestOptions = {
      quiet: false,
      watch: watchPattern
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--watch');
    expect(jestArgs).toContain(watchPattern);
  });

  it('should handle watchAll option', async () => {
    const options: TestOptions = {
      quiet: false,
      watchAll: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--watchAll');
  });

  it('should handle update option for snapshots', async () => {
    const options: TestOptions = {
      quiet: false,
      update: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestArgs = execaCalls[0][1];

    expect(jestArgs).toContain('--updateSnapshot');
  });
});