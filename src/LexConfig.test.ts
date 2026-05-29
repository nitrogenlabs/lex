import {defaultConfigValues, LexConfig, reactCompilerPluginName} from './LexConfig.js';

const resetConfig = () => {
  LexConfig.config = JSON.parse(JSON.stringify(defaultConfigValues));
};

describe('LexConfig', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('staticPath configuration', () => {
    it('should have default staticPath in webpack config', () => {
      const {config} = LexConfig;

      expect(config.webpack?.staticPath).toBe('./src/static');
    });

    it('should allow custom staticPath configuration', () => {
      const customConfig = {
        webpack: {
          staticPath: './assets'
        }
      };

      const updatedConfig = LexConfig.updateConfig(customConfig);

      expect(updatedConfig.webpack?.staticPath).toBe('./assets');
    });

    it('should merge webpack config with existing options', () => {
      const existingConfig = {
        webpack: {
          entry: './src/index.js',
          plugins: []
        }
      };

      const newConfig = {
        webpack: {
          staticPath: './public'
        }
      };

      // First update with existing config
      let updatedConfig = LexConfig.updateConfig(existingConfig);

      expect(updatedConfig.webpack?.entry).toBe('./src/index.js');
      expect(updatedConfig.webpack?.plugins).toEqual([]);

      // Then update with new config
      updatedConfig = LexConfig.updateConfig(newConfig);

      expect(updatedConfig.webpack?.staticPath).toBe('./public');
    });
  });

  describe('reactCompiler configuration', () => {
    it('should add the React Compiler SWC plugin with default options', () => {
      const updatedConfig = LexConfig.updateConfig({reactCompiler: true});
      const {plugins} = (updatedConfig.swc?.jsc as any).experimental;

      expect(plugins).toContainEqual([
        reactCompilerPluginName,
        {
          compilationMode: 'infer',
          panicThreshold: 'none',
          target: '19'
        }
      ]);
    });

    it('should merge custom React Compiler options with defaults', () => {
      const updatedConfig = LexConfig.updateConfig({
        reactCompiler: {
          compilationMode: 'annotation',
          target: '19'
        }
      });
      const {plugins} = (updatedConfig.swc?.jsc as any).experimental;

      expect(plugins).toContainEqual([
        reactCompilerPluginName,
        {
          compilationMode: 'annotation',
          panicThreshold: 'none',
          target: '19'
        }
      ]);
    });

    it('should preserve other SWC experimental plugins and replace React Compiler duplicates', () => {
      const updatedConfig = LexConfig.updateConfig({
        reactCompiler: {
          target: '19'
        },
        swc: {
          ...defaultConfigValues.swc,
          jsc: {
            ...defaultConfigValues.swc?.jsc,
            experimental: {
              plugins: [
                ['custom-swc-plugin', {enabled: true}],
                [reactCompilerPluginName, {target: '18'}]
              ]
            }
          }
        } as any
      });
      const {plugins} = (updatedConfig.swc?.jsc as any).experimental;

      expect(plugins).toEqual([
        ['custom-swc-plugin', {enabled: true}],
        [
          reactCompilerPluginName,
          {
            compilationMode: 'infer',
            panicThreshold: 'none',
            target: '19'
          }
        ]
      ]);
    });

    it('should remove React Compiler plugins when explicitly disabled', () => {
      const updatedConfig = LexConfig.updateConfig({
        reactCompiler: false,
        swc: {
          ...defaultConfigValues.swc,
          jsc: {
            ...defaultConfigValues.swc?.jsc,
            experimental: {
              plugins: [
                ['custom-swc-plugin', {enabled: true}],
                [reactCompilerPluginName, {target: '19'}]
              ]
            }
          }
        } as any
      });
      const {plugins} = (updatedConfig.swc?.jsc as any).experimental;

      expect(plugins).toEqual([
        ['custom-swc-plugin', {enabled: true}]
      ]);
    });
  });
});
