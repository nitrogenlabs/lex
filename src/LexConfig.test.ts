import {LexConfig} from './LexConfig.js';

describe('LexConfig', () => {
  describe('publicPath configuration', () => {
    it('should have default publicPath in webpack config', () => {
      const {config} = LexConfig;

      expect(config.webpack?.publicPath).toBe('./src/public');
    });

    it('should allow custom publicPath configuration', () => {
      const customConfig = {
        webpack: {
          publicPath: './assets'
        }
      };

      const updatedConfig = LexConfig.updateConfig(customConfig);

      expect(updatedConfig.webpack?.publicPath).toBe('./assets');
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
          publicPath: './public'
        }
      };

      // First update with existing config
      let updatedConfig = LexConfig.updateConfig(existingConfig);

      expect(updatedConfig.webpack?.entry).toBe('./src/index.js');
      expect(updatedConfig.webpack?.plugins).toEqual([]);

      // Then update with new config
      updatedConfig = LexConfig.updateConfig(newConfig);

      expect(updatedConfig.webpack?.publicPath).toBe('./public');
    });
  });
});