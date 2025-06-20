import {FaviconsPlugin} from './index.js';


describe('FaviconsPlugin', () => {
  describe('#getAppName', () => {
    it('should return default app name when package.json is not found', () => {
      const nonExistentPath = '/path/that/does/not/exist';
      const results = FaviconsPlugin.getAppName(nonExistentPath);
      expect(results).toBe('Webpack App');
    });
  });
});
