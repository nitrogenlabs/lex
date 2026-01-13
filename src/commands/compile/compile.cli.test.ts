import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';

import {compile, hasFileType} from './compile.js';

jest.mock('execa');
jest.mock('@swc/core');
jest.mock('fs');
jest.mock('glob');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  checkLinkedModules: jest.fn(),
  copyConfiguredFiles: jest.fn().mockResolvedValue(undefined),
  copyFiles: jest.fn().mockResolvedValue(undefined),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  getFilesByExt: jest.fn().mockReturnValue([]),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn((binary) => {
    if(binary === 'tsc') {
      return '/mock/path/to/tsc';
    }
    if(binary === 'postcss') {
      return '/mock/path/to/postcss';
    }
    return null;
  })
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/source',
      swc: {
        inlineSourcesContent: true,
        isModule: true,
        jsc: {
          externalHelpers: false,
          keepClassNames: false,
          loose: false,
          parser: {
            decorators: true,
            dynamicImport: true,
            syntax: 'typescript',
            tsx: true
          },
          target: 'es2023',
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        },
        minify: false,
        module: {
          lazy: false,
          noInterop: false,
          strict: false,
          strictMode: true,
          type: 'es6'
        },
        sourceMaps: 'inline'
      },
      useTypescript: false
    },
    getTypeScriptDeclarationFlags: jest.fn(() => [
      '--emitDeclarationOnly',
      '--declaration',
      '--declarationMap',
      '--outDir', './lib',
      '--rootDir', './src',
      '--skipLibCheck'
    ]),
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('compile', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const {LexConfig} = require('../../LexConfig.js');
  const {getFilesByExt, copyFiles, copyConfiguredFiles, removeFiles} = require('../../utils/app.js');
  const {resolveBinaryPath} = require('../../utils/file.js');

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue([]);
    (readdirSync as jest.MockedFunction<typeof readdirSync>).mockReturnValue([]);
    (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);
    (lstatSync as jest.MockedFunction<typeof lstatSync>).mockReturnValue({
      isDirectory: () => false
    } as any);
    (readFileSync as jest.MockedFunction<typeof readFileSync>).mockReturnValue('export const test = () => {};');
    (writeFileSync as jest.MockedFunction<typeof writeFileSync>).mockImplementation(() => {});
    (mkdirSync as jest.MockedFunction<typeof mkdirSync>).mockImplementation(() => {});
    getFilesByExt.mockReturnValue([]);
    copyFiles.mockResolvedValue(undefined);
    copyConfiguredFiles.mockResolvedValue(undefined);
    removeFiles.mockResolvedValue(undefined);
    LexConfig.config.useTypescript = false;
    LexConfig.config.swc = {};
    resolveBinaryPath.mockImplementation((binary) => {
      if(binary === 'tsc') {
        return '/mock/path/to/tsc';
      }
      if(binary === 'postcss') {
        return '/mock/path/to/postcss';
      }
      return null;
    });
  });

  describe('hasFileType', () => {
    it('should return false if path does not exist', () => {
      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(false);

      const result = hasFileType('/nonexistent', ['.ts']);

      expect(result).toBe(false);
    });

    it('should return true if file with matching extension exists', () => {
      (readdirSync as jest.MockedFunction<typeof readdirSync>).mockReturnValue(['test.ts'] as any);
      (lstatSync as jest.MockedFunction<typeof lstatSync>).mockReturnValue({
        isDirectory: () => false
      } as any);

      const result = hasFileType('/mock/path', ['.ts']);

      expect(result).toBe(true);
    });

    it('should return false if no matching extension found', () => {
      (readdirSync as jest.MockedFunction<typeof readdirSync>).mockReturnValue(['test.js'] as any);
      (lstatSync as jest.MockedFunction<typeof lstatSync>).mockReturnValue({
        isDirectory: () => false
      } as any);

      const result = hasFileType('/mock/path', ['.ts']);

      expect(result).toBe(false);
    });

    it('should recursively check directories', () => {
      (readdirSync as jest.MockedFunction<typeof readdirSync>)
        .mockReturnValueOnce(['subdir'] as any)
        .mockReturnValueOnce(['test.ts'] as any);
      (lstatSync as jest.MockedFunction<typeof lstatSync>)
        .mockReturnValueOnce({
          isDirectory: () => true
        } as any)
        .mockReturnValueOnce({
          isDirectory: () => false
        } as any);

      const result = hasFileType('/mock/path', ['.ts']);

      expect(result).toBe(true);
    });
  });

  describe('compile - TypeScript', () => {
    it('should handle TypeScript binary not found', async () => {
      LexConfig.config.useTypescript = true;
      resolveBinaryPath.mockReturnValue(null);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should generate TypeScript declarations successfully', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        all: '',
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should handle TypeScript compilation with warnings (has declarations)', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        all: 'Writing file: test.d.ts',
        exitCode: 1,
        stderr: 'error TS1234',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should handle TypeScript compilation failure (no declarations)', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: 'error TS1234',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should handle TypeScript errors with error lines', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: 'error TS1234: Type error',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should handle TypeScript errors with more than 10 error lines', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const manyErrors = Array.from({length: 15}, (_, i) => `error TS${1000 + i}: Error ${i}`).join('\n');
      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: manyErrors,
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should handle TypeScript compilation exception', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('TypeScript error'));

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should use custom TypeScript config when provided', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      await compile({config: 'tsconfig.custom.json'});

      expect(execa).toHaveBeenCalledWith(
        expect.stringContaining('tsc'),
        ['-p', 'tsconfig.custom.json', '--emitDeclarationOnly', '--skipLibCheck'],
        expect.any(Object)
      );
    });
  });

  describe('compile - CSS processing', () => {
    it('should process CSS files', async () => {
      getFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(execa).toHaveBeenCalledWith(
        expect.stringContaining('postcss'),
        expect.arrayContaining(['/mock/source/**/**.css']),
        expect.any(Object)
      );
    });

    it('should handle PostCSS binary not found', async () => {
      getFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      resolveBinaryPath.mockImplementation((binary) => {
        if(binary === 'postcss') {
          return null;
        }
        return '/mock/path/to/tsc';
      });

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should handle PostCSS processing errors', async () => {
      getFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('PostCSS error'));

      const result = await compile({});

      expect(result).toBe(1);
    });
  });

  describe('compile - Asset copying', () => {
    it('should copy image files', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/image.png']);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(copyFiles).toHaveBeenCalledWith(
        ['/mock/source/image.png'],
        'image',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle image copy errors', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/image.png']);

      copyFiles.mockRejectedValue(new Error('Copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should copy font files', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/font.ttf']);
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(copyFiles).toHaveBeenCalledWith(
        expect.arrayContaining(['/mock/source/font.ttf']),
        'font',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle font copy errors', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/font.ttf']);

      copyFiles.mockRejectedValue(new Error('Font copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should copy markdown files', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/readme.md']);
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(copyFiles).toHaveBeenCalledWith(
        ['/mock/source/readme.md'],
        'documents',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle markdown copy errors', async () => {
      getFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/readme.md']);

      copyFiles.mockRejectedValue(new Error('Markdown copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });
  });

  describe('compile - SWC compilation', () => {
    it('should compile TypeScript files with SWC', async () => {
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts', '/mock/source/test2.tsx'])
        .mockReturnValueOnce([]);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledTimes(2);
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should compile JavaScript files with SWC', async () => {
      (globSync as jest.MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/test.js']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("test");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledTimes(1);
    });

    it('should create output directory if it does not exist', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(mkdirSync).toHaveBeenCalled();
    });

    it('should handle TSX files with React transform', async () => {
      const {LexConfig} = require('../../LexConfig.js');
      LexConfig.config.swc = {
        inlineSourcesContent: true,
        isModule: true,
        jsc: {
          externalHelpers: false,
          keepClassNames: false,
          loose: false,
          parser: {
            decorators: true,
            dynamicImport: true,
            syntax: 'typescript',
            tsx: true
          },
          target: 'es2023',
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        },
        minify: false,
        module: {
          lazy: false,
          noInterop: false,
          strict: false,
          strictMode: true,
          type: 'es6'
        },
        sourceMaps: 'inline'
      };

      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.tsx']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const Test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          jsc: expect.objectContaining({
            parser: expect.objectContaining({
              tsx: true
            }),
            transform: expect.objectContaining({
              react: expect.objectContaining({
                runtime: 'automatic'
              })
            })
          })
        })
      );
    });

    it('should handle SWC error with stack trace', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error');
      error.stack = 'Error: SWC error\n    at compile.ts:123';
      (transform as jest.MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle SWC error with filename property', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error') as any;
      error.filename = '/mock/source/test.ts';
      (transform as jest.MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });

    it('should handle SWC error with file property', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error') as any;
      error.file = '/mock/source/test.ts';
      (transform as jest.MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });

    it('should handle non-Error exceptions in SWC', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>).mockRejectedValue('String error');

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });
  });

  describe('compile - copyConfiguredFiles', () => {
    it('should handle copyConfiguredFiles errors', async () => {
      copyConfiguredFiles.mockRejectedValue(new Error('Copy configured files failed'));

      // Mock source files so compilation proceeds
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue([
        '/mock/source/index.ts'
      ]);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });
  });

  describe('compile - options', () => {
    it('should use custom cliName', async () => {
      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({cliName: 'CustomCLI'});

      expect(result).toBe(0);
    });

    it('should use custom sourcePath', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue([]);

      const result = await compile({sourcePath: './custom/src'});

      expect(result).toBe(0);
    });

    it('should use custom outputPath', async () => {
      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({outputPath: './custom/lib'});

      expect(result).toBe(0);
    });

    it('should handle remove option', async () => {
      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({remove: true});

      expect(result).toBe(0);
      expect(removeFiles).toHaveBeenCalled();
    });

    it('should handle watch mode', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({watch: true});

      expect(result).toBe(0);
    });

    it('should handle format cjs', async () => {
      (globSync as jest.MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as jest.MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'module.exports = {};', map: ''} as any);

      const result = await compile({format: 'cjs'});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          module: expect.objectContaining({
            type: 'commonjs'
          })
        })
      );
    });

    it('should handle callback function', async () => {
      const callback = jest.fn();

      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({}, callback);

      expect(result).toBe(0);
      expect(callback).toHaveBeenCalledWith(0);
    });

    it('should handle quiet mode', async () => {
      (transform as jest.MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({quiet: true});

      expect(result).toBe(0);
    });
  });
});
