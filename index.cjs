/**
 * CommonJS entry point for @nlabs/lex
 */

module.exports = {
  Config: {
    create: (config) => config
  },
  LexConfig: require('./lib/LexConfig.js').LexConfig,
  utils: {
    aiService: require('./lib/utils/aiService.js'),
    app: require('./lib/utils/app.js'),
    file: require('./lib/utils/file.js'),
    log: require('./lib/utils/log.js')
  }
};