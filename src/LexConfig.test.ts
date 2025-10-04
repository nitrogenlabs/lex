import {LexConfig} from './LexConfig.js';

describe('LexConfig', () => {
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
});