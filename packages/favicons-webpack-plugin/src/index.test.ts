import {FaviconsPlugin} from './index';


describe('FaviconsPlugin', () => {
  describe('#getAppName', () => {
    it('should unknown app name', () => {
      const key = 'example';
      const results = FaviconsPlugin.getAppName(key);
      expect(results).toBe('example_app');
    });
  });
});
