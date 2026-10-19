import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, getFilesByExt, copyFiles, copyConfiguredFiles, removeFiles} from '../../utils/app.js';
import {resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {compile, hasFileType} from './compile.js';

import type {MockedFunction, MockInstance} from 'vitest';

const mockCopyConfiguredFiles = copyConfiguredFiles as MockedFunction<typeof copyConfiguredFiles>;
const mockCopyFiles = copyFiles as MockedFunction<typeof copyFiles>;
const mockGetFilesByExt = getFilesByExt as MockedFunction<typeof getFilesByExt>;
const mockRemoveFiles = removeFiles as MockedFunction<typeof removeFiles>;
const mockResolveBinaryPath = resolveBinaryPath as MockedFunction<typeof resolveBinaryPath>;

vi.mock('execa');
vi.mock('@swc/core');
vi.mock('fs');
vi.mock('glob');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  checkLinkedModules: vi.fn(),
  copyConfiguredFiles: vi.fn().mockResolvedValue(undefined),
  copyFiles: vi.fn().mockResolvedValue(undefined),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  getFilesByExt: vi.fn().mockReturnValue([]),
  removeFiles: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir'),
  resolveBinaryPath: vi.fn((binary) => {
    if(binary === 'tsc') {
      return '/mock/path/to/tsc';
    }
    if(binary === 'postcss') {
      return '/mock/path/to/postcss';
    }
    return '';
  })
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    config: {
      outputFullPath: '/mock/output',
      reactCompiler: undefined,
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
    getSWCConfigWithReactCompiler: vi.fn((swc, reactCompiler) => {
      if(!reactCompiler) {
        return swc;
      }

      return {
        ...swc,
        jsc: {
          ...swc?.jsc,
          experimental: {
            plugins: [
              [
                '@swc/react-compiler',
                {
                  compilationMode: 'infer',
                  panicThreshold: 'none',
                  target: '19',
                  ...(typeof reactCompiler === 'object' ? reactCompiler : {})
                }
              ]
            ]
          }
        }
      };
    }),
    getTypeScriptDeclarationFlags: vi.fn(() => [
      '--emitDeclarationOnly',
      '--declaration',
      '--declarationMap',
      '--outDir', './lib',
      '--rootDir', './src',
      '--skipLibCheck'
    ]),
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('compile', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (globSync as MockedFunction<typeof globSync>).mockReset().mockReturnValue([]);
    (readdirSync as MockedFunction<typeof readdirSync>).mockReturnValue([]);
    (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);
    (lstatSync as MockedFunction<typeof lstatSync>).mockReturnValue({
      isDirectory: () => false
    } as any);
    (readFileSync as MockedFunction<typeof readFileSync>).mockReturnValue('export const test = () => {};');
    (writeFileSync as MockedFunction<typeof writeFileSync>).mockImplementation(() => {});
    (mkdirSync as MockedFunction<typeof mkdirSync>).mockReturnValue(undefined);
    mockGetFilesByExt.mockReset().mockReturnValue([]);
    mockCopyFiles.mockResolvedValue(undefined);
    mockCopyConfiguredFiles.mockResolvedValue(undefined);
    mockRemoveFiles.mockResolvedValue(undefined);
    LexConfig.config.reactCompiler = undefined;
    LexConfig.config.useTypescript = false;
    LexConfig.config.swc = {};
    mockResolveBinaryPath.mockImplementation((binary) => {
      if(binary === 'tsc') {
        return '/mock/path/to/tsc';
      }
      if(binary === 'postcss') {
        return '/mock/path/to/postcss';
      }
      return '';
    });
  });

  describe('hasFileType', () => {
    it('should return false if path does not exist', () => {
      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(false);

      const result = hasFileType('/nonexistent', ['.ts']);

      expect(result).toBe(false);
    });

    it('should return true if file with matching extension exists', () => {
      (readdirSync as MockedFunction<typeof readdirSync>).mockReturnValue(['test.ts'] as any);
      (lstatSync as MockedFunction<typeof lstatSync>).mockReturnValue({
        isDirectory: () => false
      } as any);

      const result = hasFileType('/mock/path', ['.ts']);

      expect(result).toBe(true);
    });

    it('should return false if no matching extension found', () => {
      (readdirSync as MockedFunction<typeof readdirSync>).mockReturnValue(['test.js'] as any);
      (lstatSync as MockedFunction<typeof lstatSync>).mockReturnValue({
        isDirectory: () => false
      } as any);

      const result = hasFileType('/mock/path', ['.ts']);

      expect(result).toBe(false);
    });

    it('should recursively check directories', () => {
      (readdirSync as MockedFunction<typeof readdirSync>)
        .mockReturnValueOnce(['subdir'] as any)
        .mockReturnValueOnce(['test.ts'] as any);
      (lstatSync as MockedFunction<typeof lstatSync>)
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
      mockResolveBinaryPath.mockReturnValue('');

      const callback = vi.fn();
      const result = await compile({}, callback);

      expect(result).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(execa).not.toHaveBeenCalled();
    });

    it('should generate TypeScript declarations successfully', async () => {
      LexConfig.config.useTypescript = true;
      (existsSync as MockedFunction<typeof existsSync>).mockImplementation((path) =>
        !String(path).endsWith('tsconfig.build.json')
      );
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: '',
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
    });

    it('should use the project build config by default', async () => {
      LexConfig.config.useTypescript = true;
      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);
      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: '',
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      await compile({});

      expect(execa).toHaveBeenCalledWith(
        expect.stringContaining('tsc'),
        [
          '-p',
          expect.stringMatching(/tsconfig\.build\.json$/),
          '--emitDeclarationOnly',
          '--skipLibCheck'
        ],
        expect.any(Object)
      );
    });

    it('should exclude test-support directories from zero-config source discovery', async () => {
      LexConfig.config.useTypescript = true;
      (existsSync as MockedFunction<typeof existsSync>).mockImplementation((path) =>
        !String(path).endsWith('tsconfig.build.json')
      );
      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: '',
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      await compile({});

      expect(globSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ignore: expect.arrayContaining([
            '**/__mocks__/**',
            '**/__tests__/**',
            '**/tests/**'
          ])
        })
      );
    });

    it('should fail despite declaration-looking compiler output', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: 'Writing file: test.d.ts',
        exitCode: 1,
        stderr: 'error TS1234',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should handle TypeScript compilation failure (no declarations)', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: 'error TS1234',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should handle TypeScript errors with error lines', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: 'error TS1234: Type error',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should handle TypeScript errors with more than 10 error lines', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const manyErrors = Array.from({length: 15}, (_, i) => `error TS${1000 + i}: Error ${i}`).join('\n');
      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: 'TypeScript compilation failed',
        exitCode: 1,
        stderr: manyErrors,
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should handle TypeScript compilation exception', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('TypeScript error'));

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });

    it.each([
      {all: 'Writing test.d.ts', exitCode: 1, stderr: '', stdout: 'error TS1234: invalid type'},
      {all: 'Declaration emitted', exitCode: 2, stderr: 'error TS1234: invalid type', stdout: ''},
      {all: '', exitCode: null, signal: 'SIGTERM', stderr: '', stdout: ''},
      {all: '', exitCode: undefined, stderr: '', stdout: ''},
      {all: '', exitCode: 1, stderr: '', stdout: ''}
    ])('should stop all later stages after declaration failure: $exitCode $all', async (failure) => {
      LexConfig.config.useTypescript = true;
      (execa as MockedFunction<typeof execa>).mockResolvedValue(failure as any);
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);
      mockGetFilesByExt.mockReturnValue(['/mock/source/image.png']);
      const callback = vi.fn();

      expect(await compile({}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(transform).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(copyFiles).not.toHaveBeenCalled();
      expect(copyConfiguredFiles).not.toHaveBeenCalled();
      expect(execa).toHaveBeenCalledTimes(1);
      expect(vi.mocked(createSpinner).mock.results.at(-1)?.value.succeed).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith(expect.stringContaining(failure.stderr || failure.stdout || 'Unknown error'), 'error', undefined);
    });

    it.each([
      {code: 'ENOENT', message: 'SENTINEL /private/secret --token=credential', stack: 'SENTINEL stack'},
      {code: 'SENTINEL /private/secret', message: 'SENTINEL /private/secret', stack: 'SENTINEL stack'},
      'SENTINEL /private/secret'
    ])('should sanitize rejected compiler launches and fail once', async (error) => {
      LexConfig.config.useTypescript = true;
      (execa as MockedFunction<typeof execa>).mockRejectedValue(error);
      const callback = vi.fn();

      expect(await compile({}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(transform).not.toHaveBeenCalled();
      expect(copyConfiguredFiles).not.toHaveBeenCalled();

      const output = JSON.stringify(vi.mocked(log).mock.calls);

      expect(output).toContain('tsc');
      expect(output).not.toContain('SENTINEL');
      expect(output).not.toContain('/private/secret');
      expect(output).not.toContain('credential');
    });

    it('should retain failure status in quiet mode', async () => {
      LexConfig.config.useTypescript = true;
      (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 1} as any);
      const callback = vi.fn();

      expect(await compile({quiet: true}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(transform).not.toHaveBeenCalled();
    });

    it('should sanitize a failed launch returned with reject disabled', async () => {
      LexConfig.config.useTypescript = true;
      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        all: 'SENTINEL launch details', code: 'ENOENT', exitCode: undefined,
        stderr: 'SENTINEL /private/secret', stdout: 'SENTINEL credential'
      } as any);
      const callback = vi.fn();

      expect(await compile({}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(transform).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith(expect.stringContaining('tsc: ENOENT'), 'error', undefined);
      expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('SENTINEL');
    });

    it('should not invoke a throwing failure callback twice', async () => {
      LexConfig.config.useTypescript = true;
      (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 1} as any);
      const error = new Error('caller callback failure');
      const callback = vi.fn(() => {
        throw error;
      });

      await expect(compile({}, callback)).rejects.toBe(error);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('should use custom TypeScript config when provided', async () => {
      LexConfig.config.useTypescript = true;
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
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
      mockGetFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockResolvedValue({
        exitCode: 0,
        stderr: '',
        stdout: ''
      } as any);

      (transform as MockedFunction<typeof transform>)
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
      mockGetFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockResolveBinaryPath.mockImplementation((binary) => {
        if(binary === 'postcss') {
          return '';
        }
        return '/mock/path/to/tsc';
      });

      const callback = vi.fn();
      const result = await compile({}, callback);

      expect(result).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(execa).not.toHaveBeenCalled();
    });

    it('should handle PostCSS processing errors', async () => {
      mockGetFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('PostCSS error'));

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should sanitize rejected PostCSS launches and fail once', async () => {
      mockGetFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (execa as MockedFunction<typeof execa>).mockRejectedValue({
        code: 'ENOENT', message: 'SENTINEL /private/secret --token=credential', stack: 'SENTINEL stack'
      });
      const callback = vi.fn();

      expect(await compile({}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(transform).not.toHaveBeenCalled();
      expect(copyConfiguredFiles).not.toHaveBeenCalled();

      const output = JSON.stringify(vi.mocked(log).mock.calls);

      expect(output).toContain('postcss');
      expect(output).toContain('ENOENT');
      expect(output).not.toContain('SENTINEL');
      expect(output).not.toContain('credential');
    });

    it('should preserve diagnostics from an actually launched PostCSS process', async () => {
      mockGetFilesByExt.mockReturnValueOnce(['/mock/source/style.css']);
      (execa as MockedFunction<typeof execa>).mockRejectedValue({
        exitCode: 1, stderr: 'Invalid CSS: unexpected token', stdout: ''
      });
      const callback = vi.fn();

      expect(await compile({}, callback)).toBe(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith(1);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Invalid CSS: unexpected token'), 'error', undefined);
    });
  });

  describe('compile - Asset copying', () => {
    it('should copy image files', async () => {
      mockGetFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/image.png']);

      (transform as MockedFunction<typeof transform>)
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
      mockGetFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/image.png']);

      mockCopyFiles.mockRejectedValue(new Error('Copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should copy font files', async () => {
      mockGetFilesByExt
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/font.ttf']);
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (transform as MockedFunction<typeof transform>)
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
      mockGetFilesByExt.mockImplementation((ext) => (ext === '.ttf' ? ['/mock/source/font.ttf'] : []));

      mockCopyFiles.mockRejectedValue(new Error('Font copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });

    it('should copy markdown files', async () => {
      mockGetFilesByExt
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
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      (transform as MockedFunction<typeof transform>)
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
      mockGetFilesByExt.mockImplementation((ext) => (ext === '.md' ? ['/mock/source/readme.md'] : []));

      mockCopyFiles.mockRejectedValue(new Error('Markdown copy failed'));

      const result = await compile({});

      expect(result).toBe(1);
    });
  });

  describe('compile - SWC compilation', () => {
    it('should compile TypeScript files with SWC', async () => {
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce(['/mock/source/test.ts', '/mock/source/test2.tsx'])
        .mockReturnValueOnce([]);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledTimes(2);
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should compile JavaScript files with SWC', async () => {
      (globSync as MockedFunction<typeof globSync>)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['/mock/source/test.js']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("test");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledTimes(1);
    });

    it('should create output directory if it does not exist', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(mkdirSync).toHaveBeenCalled();
    });

    it('should handle TSX files with React transform', async () => {
      (LexConfig as any).config.swc = {
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

      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.tsx']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
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

    it('should inject React Compiler options into SWC transform calls', async () => {
      LexConfig.config.reactCompiler = true;
      LexConfig.config.swc = {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true
          }
        }
      } as any;

      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.tsx']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const Test = () => {};', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(0);
      expect(transform).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          jsc: expect.objectContaining({
            experimental: {
              plugins: [
                [
                  '@swc/react-compiler',
                  {
                    compilationMode: 'infer',
                    panicThreshold: 'none',
                    target: '19'
                  }
                ]
              ]
            }
          })
        })
      );
    });

    it('should handle SWC error with stack trace', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error');
      error.stack = 'Error: SWC error\n    at compile.ts:123';
      (transform as MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle SWC error with filename property', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error') as any;
      error.filename = '/mock/source/test.ts';
      (transform as MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });

    it('should handle SWC error with file property', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      const error = new Error('SWC error') as any;
      error.file = '/mock/source/test.ts';
      (transform as MockedFunction<typeof transform>).mockRejectedValue(error);

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });

    it('should handle non-Error exceptions in SWC', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>).mockRejectedValue('String error');

      const result = await compile({quiet: false});

      expect(result).toBe(1);
    });
  });

  describe('compile - copyConfiguredFiles', () => {
    it('should handle copyConfiguredFiles errors', async () => {
      mockCopyConfiguredFiles.mockRejectedValue(new Error('Copy configured files failed'));

      // Mock source files so compilation proceeds
      (globSync as MockedFunction<typeof globSync>).mockReturnValue([
        '/mock/source/index.ts'
      ]);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({});

      expect(result).toBe(1);
    });
  });

  describe('compile - options', () => {
    it('should use custom cliName', async () => {
      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({cliName: 'CustomCLI'});

      expect(result).toBe(0);
    });

    it('should use custom sourcePath', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue([]);

      const result = await compile({sourcePath: './custom/src'});

      expect(result).toBe(0);
    });

    it('should use custom outputPath', async () => {
      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({outputPath: './custom/lib'});

      expect(result).toBe(0);
    });

    it('should handle remove option', async () => {
      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({remove: true});

      expect(result).toBe(0);
      expect(removeFiles).toHaveBeenCalled();
    });

    it('should handle watch mode', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'export const test = () => {};', map: ''} as any);

      const result = await compile({watch: true});

      expect(result).toBe(0);
    });

    it('should handle format cjs', async () => {
      (globSync as MockedFunction<typeof globSync>).mockReturnValue(['/mock/source/test.ts']);

      (existsSync as MockedFunction<typeof existsSync>).mockReturnValue(true);

      (transform as MockedFunction<typeof transform>)
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
      const callback = vi.fn();

      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({}, callback);

      expect(result).toBe(0);
      expect(callback).toHaveBeenCalledExactlyOnceWith(0);
    });

    it('should handle quiet mode', async () => {
      (transform as MockedFunction<typeof transform>)
        .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

      const result = await compile({quiet: true});

      expect(result).toBe(0);
    });
  });
});
