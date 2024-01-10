import {StaticSitePlugin} from './index';


describe('StaticSitePlugin', () => {
  describe('#makeObject', () => {
    it('should make object', () => {
      const key = 'key';
      const value = 'value';
      const results = StaticSitePlugin.makeObject(key, value);
      expect(results[key]).toBe(value);
    });
  });
});
