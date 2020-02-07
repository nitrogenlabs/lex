import getFileInfo from './common/getFileInfo';
import loadPlugins from './common/loadPlugins';
import * as sharedUtil from './common/utilShared';
import config from './config/resolveConfig';
import doc from './doc';
import core from './main/core';
import {getSupportInfo} from './main/support';

const {version} = require('../package.json');

// Luckily `opts` is always the 2nd argument
const getWithPlugins = (fn) => (...args) => {
  const opts = args[1] || {};

  args[1] = {
    ...opts,
    plugins: loadPlugins(opts.plugins, opts.pluginSearchDirs)
  };

  return fn(...args);
};

const withPlugins = (fn) => {
  const resultingFn: any = getWithPlugins(fn);
  if(fn.sync) {
    resultingFn.sync = getWithPlugins(fn.sync);
  }
  return resultingFn;
};

const formatWithCursor = getWithPlugins(core.formatWithCursor);

module.exports = {
  formatWithCursor,

  format(text, opts) {
    return formatWithCursor(text, opts).formatted;
  },

  check(text, opts) {
    const {formatted} = formatWithCursor(text, opts);
    return formatted === text;
  },

  doc,

  resolveConfig: config.resolveConfig,
  resolveConfigFile: config.resolveConfigFile,
  clearConfigCache: config.clearCache,

  getFileInfo: withPlugins(getFileInfo),
  getSupportInfo: withPlugins(getSupportInfo),

  version,

  util: sharedUtil,

  /* istanbul ignore next */
  __debug: {
    parse: withPlugins(core.parse),
    formatAST: withPlugins(core.formatAST),
    formatDoc: withPlugins(core.formatDoc),
    printToDoc: withPlugins(core.printToDoc),
    printDocToString: withPlugins(core.printDocToString)
  }
};
