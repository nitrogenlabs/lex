import {build as esBuild} from 'esbuild';
import {execa} from 'execa';

import {build, buildWithEsBuild, buildWithWebpack} from './build.js';
import {LexConfig, defaultConfigValues} from '../LexConfig.js';
import {checkLinkedModules, removeFiles} from '../utils/app.js';

jest.mock('esbuild', () => ({
  ...jest.requireActual('esbuild'),
  build: jest.fn(() => Promise.resolve({}))
}));

jest.mock('execa', () => ({
  ...jest.requireActual('execa'),
  execa: jest.fn(() => Promise.resolve({}))
}));

jest.mock('@luckycatfactory/esbuild-graphql-loader', () => ({
  ...jest.requireActual('@luckycatfactory/esbuild-graphql-loader'),
  __esModule: true,
  default: jest.fn(() => 'esbuildGraphqlLoader')
}));

jest.mock('../utils/app', () => ({
  ...jest.requireActual('../utils/app'),
  checkLinkedModules: jest.fn(),
  removeFiles: jest.fn(() => Promise.resolve())
}));

jest.mock('../LexConfig', () => ({
  LexConfig: {
    config: {},
    checkTypescriptConfig: jest.fn(),
    parseConfig: jest.fn()
  }
}));

describe('build', () => {
  let callback: jest.Mock;
  let spinner: any;
  let oldConsole;

  beforeAll(() => {
    oldConsole = {...console};
    console = {
      ...oldConsole,
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  beforeEach(() => {
    LexConfig.config = {
      ...defaultConfigValues
    };

    callback = jest.fn();
    spinner = {
      succeed: jest.fn(),
      fail: jest.fn()
    };
  });

  afterAll(() => {
    console = {...oldConsole};
    jest.resetAllMocks();
  });

  describe('buildWithEsBuild', () => {
    beforeEach(() => {
      (esBuild as jest.Mock).mockImplementation(() => Promise.resolve({}));
    });

    it('should build using default config', async () => {
      const status: number = await buildWithEsBuild(spinner, {}, callback);
      expect(esBuild).toHaveBeenCalledWith({
        bundle: true,
        color: true,
        entryPoints: [undefined],
        loader: {
          '.js': 'js'
        },
        outdir: undefined,
        platform: 'node',
        plugins: [],
        sourcemap: 'inline',
        target: 'es2016',
        watch: false
      });
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should build for node', async () => {
      LexConfig.config = {
        ...defaultConfigValues,
        targetEnvironment: 'node'
      };
      const status: number = await buildWithEsBuild(spinner, {}, callback);
      expect(esBuild).toHaveBeenCalledWith({
        bundle: true,
        color: true,
        entryPoints: [undefined],
        loader: {
          '.js': 'js'
        },
        outdir: undefined,
        platform: 'node',
        plugins: [],
        sourcemap: 'inline',
        target: 'node18',
        watch: false
      });
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should build using typescript', async () => {
      LexConfig.config = {
        ...defaultConfigValues,
        useTypescript: true
      };
      const callback = jest.fn();
      const status: number = await buildWithEsBuild(spinner, {cliName: 'Test'}, callback);
      expect(esBuild).toHaveBeenCalledWith({
        bundle: true,
        color: true,
        entryPoints: [undefined],
        loader: {
          '.js': 'js',
          '.ts': 'ts',
          '.tsx': 'tsx'
        },
        outdir: undefined,
        platform: 'node',
        plugins: [],
        sourcemap: 'inline',
        target: 'es2016',
        watch: false
      });
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should build using graphql', async () => {
      LexConfig.config = {
        ...defaultConfigValues,
        useGraphQl: true
      };
      const status: number = await buildWithEsBuild(spinner, {cliName: 'Test'}, callback);

      expect(esBuild).toHaveBeenCalledWith({
        bundle: true,
        color: true,
        entryPoints: [undefined],
        loader: {
          '.js': 'js'
        },
        outdir: undefined,
        platform: 'node',
        plugins: ['esbuildGraphqlLoader'],
        sourcemap: 'inline',
        target: 'es2016',
        watch: false
      });
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should handle errors', async () => {
      (esBuild as jest.Mock).mockImplementation(() => Promise.reject(new Error('Mock Error')));
      const status: number = await buildWithEsBuild(spinner, {cliName: 'Test'}, callback);

      expect(spinner.succeed).not.toHaveBeenCalled();
      expect(spinner.fail).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(1);
      expect(status).toBe(1);
    });
  });

  describe('buildWithWebpack', () => {
    beforeEach(() => {
      (execa as jest.Mock).mockImplementation(() => Promise.resolve({}));
    });

    it('should build using default config', async () => {
      const status: number = await buildWithWebpack(spinner, {}, callback);
      expect(execa).toHaveBeenCalledWith(
        expect.stringContaining('/node_modules/webpack-cli/bin/cli.js'),
        [
          '--color',
          '--progress',
          '--stats-error-details',
          '--config', expect.stringContaining('/packages/lex/webpack.config.js')
        ],
        {encoding: 'utf-8', stdio: 'inherit'}
      );
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should build using custom options', async () => {
      LexConfig.config = {
        ...defaultConfigValues,
        useTypescript: true
      };
      const callback = jest.fn();
      const cmd = {
        analyze: true,
        cliName: 'Lex',
        config: 'config.js',
        configName: 'configName',
        defineProcessEnvNodeEnv: 'development',
        devtool: 'devtool',
        disableInterpret: true,
        entry: 'entry',
        env: 'env',
        failOnWarnings: true,
        json: 'json',
        merge: 'merge',
        mode: 'mode',
        name: 'name',
        nodeEnv: 'nodeEnv',
        noDevtool: true,
        noStats: true,
        noTarget: true,
        noWatch: true,
        noWatchOptionsStdin: true,
        outputPath: 'outputPath',
        quiet: false,
        stats: 'stats',
        target: 'target',
        watch: true,
        watchOptionsStdin: true
      };
      const status: number = await buildWithWebpack(spinner, cmd, callback);
      expect(execa).toHaveBeenCalledWith(
        expect.stringContaining('/node_modules/webpack-cli/bin/cli.js'),
        [
          '--color',
          '--progress',
          '--stats-error-details',
          '--config', 'config.js',
          '--analyze',
          '--config-name', 'configName',
          '--define-process-env-node-env', 'development',
          '--devtool', 'devtool',
          '--disable-interpret',
          '--entry', 'entry',
          '--env', 'env',
          '--fail-on-warnings',
          '--json', 'json',
          '--mode', 'mode',
          '--merge',
          '--name', 'name',
          '--no-devtool',
          '--no-stats',
          '--no-target',
          '--no-watch',
          '--no-watch-options-stdin',
          '--node-env', 'nodeEnv',
          '--output-path', 'outputPath',
          '--stats', 'stats',
          '--target', 'target',
          '--watch',
          '--watch-options-stdin'
        ],
        {encoding: 'utf-8', stdio: 'inherit'}
      );
      expect(spinner.succeed).toHaveBeenCalled();
      expect(spinner.fail).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
      expect(status).toBe(0);
    });

    it('should handle errors', async () => {
      (execa as jest.Mock).mockImplementation(() => Promise.reject(new Error('Mock Error')));
      const status: number = await buildWithWebpack(spinner, {cliName: 'Test'}, callback);

      expect(spinner.succeed).not.toHaveBeenCalled();
      expect(spinner.fail).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(1);
      expect(status).toBe(1);
    });
  });

  describe('build', () => {
    it('should build with defaults', async () => {
      const status: number = await build({}, callback);
      expect(checkLinkedModules).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(1);
      expect(status).toBe(1);
    });

    it('should build with defined props', async () => {
      LexConfig.config = {
        ...defaultConfigValues,
        useTypescript: true
      };
      const status: number = await build({
        bundler: 'esbuild',
        remove: true
      }, callback);
      expect(checkLinkedModules).toHaveBeenCalled();
      expect(removeFiles).toHaveBeenCalled();
      expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(1);
      expect(status).toBe(1);
    });

    it('should error on bad variables value', async () => {
      const status: number = await build({
        bundler: 'esbuild',
        variables: 'test'
      }, callback);
      expect(callback).toHaveBeenCalledWith(1);
      expect(status).toBe(1);
    });
  });
});
