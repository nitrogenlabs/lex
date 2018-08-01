import {declare} from '@babel/helper-plugin-utils';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {babelPlugins: plugins = [], babelPresets: presets = []} = lexConfig;

export default declare((api) => {
  api.assertVersion(7);
  return {plugins, presets};
});
